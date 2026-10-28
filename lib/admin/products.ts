import "server-only";
import { randomUUID } from "node:crypto";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { normalizeComponent } from "@/lib/catalog/normalize";
import { PRODUCT_SCHEMAS, parseSpecFields, getSpecFields } from "./component-fields";
import { prepareProductPhoto } from "./product-images";

export class ProductInputError extends Error {
  constructor(
    message: string,
    public fields: Record<string, string> = {},
  ) {
    super(message);
  }
}
const basic = z.object({
  id: z.uuid().optional(),
  category: z.enum([
    "cpu",
    "gpu",
    "mobo",
    "ram",
    "storage",
    "psu",
    "case",
    "cooler_air",
    "cooler_aio",
  ]),
  name: z.string().trim().min(1).max(180),
  brand: z.string().trim().min(1).max(60),
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  source: z
    .url()
    .refine((value) => /^https?:\/\//.test(value))
    .optional(),
  tdpW: z.coerce.number().int().min(0).max(32767).nullable(),
  warrantyMonths: z.coerce.number().int().min(0).max(120).nullable(),
  isActive: z.boolean(),
});
export function parseProductForm(form: FormData) {
  const parsed = basic.safeParse({
    id: form.get("id") || undefined,
    category: form.get("category"),
    name: form.get("name"),
    brand: form.get("brand"),
    slug: form.get("slug"),
    source: form.get("source") || undefined,
    tdpW: form.get("tdpW") === "" || !form.has("tdpW") ? null : form.get("tdpW"),
    warrantyMonths: form.get("warrantyMonths") || null,
    isActive: form.get("isActive") === "on",
  });
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) fields[String(issue.path[0])] = "Revisá este dato.";
    throw new ProductInputError("Revisá los campos señalados.", fields);
  }
  const data = parsed.data;
  let spec: Record<string, unknown>;
  try {
    spec = parseSpecFields(data.category, form);
  } catch (error) {
    throw new ProductInputError(
      error instanceof Error ? error.message : "Revisá las especificaciones.",
    );
  }
  if (data.isActive) {
    for (const key of [
      "memorySupport",
      "socketSupport",
      ...(data.category === "case" ? ["formFactor", "psuFormFactor"] : []),
    ]) {
      if (key in spec && Array.isArray(spec[key]) && !(spec[key] as unknown[]).length)
        throw new ProductInputError("Para publicar, indicá los formatos o sockets admitidos.", {
          [`spec.${key}`]: "Añadí al menos un valor confirmado.",
        });
    }
    if (!data.source)
      throw new ProductInputError("Para publicar, añadí la fuente de la ficha técnica.", {
        source: "Falta la URL de referencia.",
      });
    const validation = PRODUCT_SCHEMAS[data.category].safeParse(spec);
    if (!validation.success) {
      const fields: Record<string, string> = {};
      const descriptors = getSpecFields(data.category);
      for (const issue of validation.error.issues) {
        const key = issue.path.join(".");
        fields[`spec.${key}`] =
          key === "tbw"
            ? "El SSD necesita un valor TBW positivo."
            : "Completá o corregí esta especificación.";
      }
      const first = descriptors.find((field) => fields[`spec.${field.path}`]);
      throw new ProductInputError(
        first
          ? `Para publicar, revisá: ${first.label}.`
          : "La ficha todavía no está completa para publicar.",
        fields,
      );
    }
    spec = validation.data;
  }
  const electrical =
    data.tdpW ??
    (data.category === "cpu"
      ? Number(spec.tdpWBase)
      : data.category === "gpu"
        ? Number(spec.tdpW)
        : NaN);
  return {
    ...data,
    spec,
    tdpW:
      Number.isInteger(electrical) && electrical >= 0 && electrical <= 32767 ? electrical : null,
  };
}

export async function saveProductRecord(form: FormData) {
  const data = parseProductForm(form);
  const mode = form.get("priceMode");
  if (mode !== null && mode !== "priced" && mode !== "quote")
    throw new ProductInputError("Elegí Con precio o Por cotizar.", {
      priceMode: "Revisá esta opción.",
    });
  const commerce =
    mode === "priced"
      ? z
          .object({
            amount: z
              .string()
              .regex(/^\d+(\.\d{1,2})?$/)
              .transform(Number)
              .pipe(z.number().min(0.01).max(1000000)),
            stockQty: z.preprocess(
              (value) => (value === "" || value === null ? null : value),
              z.coerce.number().int().min(0).max(1000000).nullable(),
            ),
            inStock: z.boolean(),
          })
          .safeParse({
            amount: form.get("priceAmount"),
            stockQty: form.get("priceStockQty"),
            inStock: form.get("priceInStock") === "on",
          })
      : null;
  if (commerce && !commerce.success) {
    const fields: Record<string, string> = {};
    for (const issue of commerce.error.issues)
      fields[issue.path[0] === "amount" ? "priceAmount" : "priceStockQty"] =
        "Ingresá un valor válido; el precio admite hasta dos decimales.";
    throw new ProductInputError("Revisá el precio y la cantidad disponible.", fields);
  }
  if (commerce?.success && commerce.data.inStock && commerce.data.stockQty === 0)
    throw new ProductInputError("Con cantidad cero, desmarcá Disponible para vender.", {
      priceStockQty: "Indicá una cantidad positiva o dejá el campo vacío.",
    });
  const file = form.get("photo");
  const extra = form
    .getAll("galleryPhotos")
    .filter((item): item is File => item instanceof File && item.size > 0);
  const files = [...(file instanceof File && file.size > 0 ? [file] : []), ...extra];
  if (files.length > 6 || files.reduce((total, item) => total + item.size, 0) > 18 * 1024 * 1024)
    throw new ProductInputError("Podés guardar hasta 6 fotos de 3 MB cada una.");
  const prepared: Array<{ id: string } & Awaited<ReturnType<typeof prepareProductPhoto>>> = [];
  for (const upload of files) {
    try {
      prepared.push({ id: randomUUID(), ...(await prepareProductPhoto(upload)) });
    } catch (error) {
      throw new ProductInputError(
        error instanceof Error ? error.message : "No se pudo procesar la foto.",
        { photo: "Revisá las fotos seleccionadas." },
      );
    }
  }
  const photo = file instanceof File && file.size > 0 ? prepared[0] : undefined;
  const removeIds = form.getAll("deletePhotos").map(String);
  if (removeIds.some((value) => !z.uuid().safeParse(value).success))
    throw new ProductInputError("La selección de fotos no es válida.");
  if (photo && form.get("removePhoto") === "on")
    throw new ProductInputError("Elegí reemplazar o quitar la foto, no ambas opciones a la vez.");
  const id = data.id ?? randomUUID();
  await getDb().transaction(async (tx) => {
    if (data.id) {
      const [current] = await tx
        .select()
        .from(schema.components)
        .where(eq(schema.components.id, data.id))
        .for("update");
      if (!current) throw new ProductInputError("El producto ya no existe.");
      if (current.category !== data.category || current.slug !== data.slug)
        throw new ProductInputError(
          "La categoría y el identificador de un producto existente no se pueden cambiar.",
        );
      if (form.get("version") !== current.updatedAt.toISOString())
        throw new ProductInputError(
          "Este producto cambió desde que abriste el formulario. Recargá antes de guardar para no sobrescribir otro cambio.",
        );
      await tx
        .update(schema.components)
        .set({
          brand: data.brand,
          model: data.name.slice(0, 120),
          nameDisplay: data.name,
          spec: data.spec,
          tdpW: data.tdpW,
          warrantyMonths: data.warrantyMonths,
          sources: data.source ? [{ url: data.source, fetchedAt: new Date().toISOString() }] : [],
          isActive: data.isActive,
          updatedAt: new Date(Math.max(Date.now(), current.updatedAt.getTime() + 1)),
        })
        .where(eq(schema.components.id, id));
    } else {
      await tx.insert(schema.components).values({
        id,
        slug: data.slug,
        category: data.category,
        brand: data.brand,
        model: data.name.slice(0, 120),
        nameDisplay: data.name,
        spec: data.spec,
        tdpW: data.tdpW,
        warrantyMonths: data.warrantyMonths,
        sources: data.source ? [{ url: data.source, fetchedAt: new Date().toISOString() }] : [],
        isActive: data.isActive,
      });
    }
    const old = (
      await tx
        .select()
        .from(schema.componentImages)
        .where(eq(schema.componentImages.componentId, id))
    ).sort(
      (a, b) =>
        Number(b.isPrimary) - Number(a.isPrimary) ||
        a.sortOrder - b.sortOrder ||
        a.id.localeCompare(b.id),
    );
    if (removeIds.some((imageId) => !old.some((item) => item.id === imageId)))
      throw new ProductInputError("Una foto cambió. Recargá la ficha.");
    const remove = new Set(removeIds);
    if ((photo || form.get("removePhoto") === "on") && old[0]) remove.add(old[0].id);
    const retained = old.filter((item) => !remove.has(item.id));
    if (retained.length + prepared.length > 6)
      throw new ProductInputError(
        "El producto admite hasta 6 fotos. Quitá alguna antes de añadir más.",
      );
    const requested = String(form.get("primaryPhoto") || "");
    if (requested && !retained.some((item) => item.id === requested))
      throw new ProductInputError("La foto principal seleccionada ya no está disponible.");
    const primary = photo?.id || requested || retained[0]?.id || prepared[0]?.id;
    for (const item of old)
      if (remove.has(item.id))
        await tx.delete(schema.componentImages).where(eq(schema.componentImages.id, item.id));
    for (const [index, item] of retained.entries()) {
      const caption =
        form.get(`imageAlt.${item.id}`) ?? (item.id === old[0]?.id ? form.get("photoAlt") : null);
      await tx
        .update(schema.componentImages)
        .set({
          isPrimary: item.id === primary,
          sortOrder: index,
          ...(caption !== null
            ? {
                altEs: String(caption || data.name)
                  .trim()
                  .slice(0, 240),
              }
            : {}),
        })
        .where(eq(schema.componentImages.id, item.id));
    }
    for (const [index, item] of prepared.entries())
      await tx.insert(schema.componentImages).values({
        componentId: id,
        ...item,
        variant: "product",
        isPrimary: item.id === primary,
        sortOrder: retained.length + index,
        altEs:
          item === photo
            ? String(form.get("photoAlt") || data.name)
                .trim()
                .slice(0, 240)
            : `${data.name} · vista ${retained.length + index + 1}`,
      });
    if (mode !== null) {
      let [store] = await tx
        .select()
        .from(schema.stores)
        .where(eq(schema.stores.isOwn, true))
        .for("update");
      if (!store && mode === "priced") {
        const setup = z
          .object({
            name: z.string().trim().min(1).max(120),
            city: z.string().trim().min(1).max(80),
          })
          .safeParse({ name: form.get("ownStoreName"), city: form.get("ownStoreCity") });
        if (!setup.success)
          throw new ProductInputError(
            "Para guardar tu primer precio, completá el nombre y la ciudad de tu tienda.",
            { ownStoreName: "Completá los datos reales de tu tienda." },
          );
        [store] = await tx
          .insert(schema.stores)
          .values({
            ...setup.data,
            slug: `tienda-propia-${randomUUID()}`,
            isOwn: true,
            isActive: true,
          })
          .returning();
      }
      if (store) {
        if (!store.isActive && mode === "priced")
          throw new ProductInputError(
            "Tu tienda está desactivada. Reactivala antes de asignar precios.",
          );
        const [previous] = await tx
          .select()
          .from(schema.prices)
          .where(and(eq(schema.prices.componentId, id), eq(schema.prices.storeId, store.id)))
          .orderBy(desc(schema.prices.observedAt), desc(schema.prices.id))
          .limit(1);
        if (String(form.get("priceVersion") ?? "") !== (previous?.id ?? ""))
          throw new ProductInputError(
            "El precio cambió desde que abriste la ficha. Recargá antes de guardar.",
          );
        const input = commerce?.success ? commerce.data : null;
        const amount = input ? input.amount.toFixed(2) : "0.00";
        const inStock = input?.inStock ?? false;
        const stockQty = input?.stockQty ?? null;
        if (
          (input || previous) &&
          (!previous ||
            previous.amount !== amount ||
            previous.inStock !== inStock ||
            previous.stockQty !== stockQty)
        ) {
          const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
          const category = data.category.startsWith("cooler_") ? "cooler" : data.category;
          await tx
            .insert(schema.prices)
            .values({
              componentId: id,
              storeId: store.id,
              amount,
              currency: "BOB",
              inStock,
              stockQty,
              observedAt: new Date(Math.max(Date.now(), (previous?.observedAt.getTime() ?? 0) + 1)),
              sourceUrl: new URL(`/catalog/${category}/${data.slug}`, origin).href,
            });
        }
      }
    }
  });
  return { id, published: data.isActive };
}

export async function getProductCommerce(componentId?: string) {
  const [store] = await getDb().select().from(schema.stores).where(eq(schema.stores.isOwn, true));
  const [offer] =
    store && componentId
      ? await getDb()
          .select()
          .from(schema.prices)
          .where(
            and(eq(schema.prices.componentId, componentId), eq(schema.prices.storeId, store.id)),
          )
          .orderBy(desc(schema.prices.observedAt), desc(schema.prices.id))
          .limit(1)
      : [];
  return {
    store: store ? { name: store.name, city: store.city, active: store.isActive } : null,
    mode: offer && Number(offer.amount) > 0 ? ("priced" as const) : ("quote" as const),
    amount: offer && Number(offer.amount) > 0 ? offer.amount : "",
    inStock: offer?.inStock ?? true,
    stockQty: offer?.stockQty ?? null,
    version: offer?.id ?? "",
  };
}

export async function duplicateProductRecord(id: string) {
  if (!z.uuid().safeParse(id).success) throw new ProductInputError("Producto no válido.");
  return getDb().transaction(async (tx) => {
    const [row] = await tx.select().from(schema.components).where(eq(schema.components.id, id));
    if (!row) throw new ProductInputError("El producto ya no existe.");
    const copyId = randomUUID();
    await tx
      .insert(schema.components)
      .values({
        id: copyId,
        slug: `${row.slug.slice(0, 110)}-${copyId.slice(0, 8)}`,
        category: row.category,
        brand: row.brand,
        model: row.model,
        nameDisplay: `${row.nameDisplay.slice(0, 172)} (copia)`,
        spec: row.spec,
        sources: row.sources,
        tdpW: row.tdpW,
        warrantyMonths: row.warrantyMonths,
        isActive: false,
      });
    return { id: copyId };
  });
}

export async function changeProductPublication(id: string, published: boolean, version: string) {
  z.uuid().parse(id);
  return getDb().transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(schema.components)
      .where(eq(schema.components.id, id))
      .for("update");
    if (!row) throw new ProductInputError("El producto ya no existe.");
    if (row.updatedAt.toISOString() !== version)
      throw new ProductInputError("El producto cambió. Recargá el listado e intentá de nuevo.");
    if (published) {
      if (
        !(row.category in PRODUCT_SCHEMAS) ||
        [
          "memorySupport",
          "socketSupport",
          ...(row.category === "case" ? ["formFactor", "psuFormFactor"] : []),
        ].some((key) => {
          const values = row.spec[key];
          return Array.isArray(values) && values.length === 0;
        }) ||
        !row.sources.some((source) => /^https?:\/\//.test(source.url)) ||
        !normalizeComponent(
          {
            id: row.id,
            slug: row.slug,
            brand: row.brand,
            name_display: row.nameDisplay,
            spec: row.spec,
            sources: row.sources,
          },
          row.category,
        )
      )
        throw new ProductInputError(
          "Abrí la ficha y completá sus especificaciones y fuente antes de publicar.",
        );
    }
    await tx
      .update(schema.components)
      .set({
        isActive: published,
        updatedAt: new Date(Math.max(Date.now(), row.updatedAt.getTime() + 1)),
      })
      .where(eq(schema.components.id, id));
    return { id, published };
  });
}
