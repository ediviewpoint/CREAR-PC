import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";
import sharp from "sharp";
import * as schema from "@/lib/db/schema";
import { PRODUCT_CATEGORIES, getSpecFields, parseSpecFields, specValue } from "./component-fields";
import { makeCompatibleBuild } from "@/lib/compat/__tests__/fixtures";
const context = vi.hoisted(() => ({
  db: undefined as unknown,
  admin: true,
  paths: [] as string[],
}));
vi.mock("@/lib/db", async () => ({
  getDb: () => context.db,
  schema: await import("@/lib/db/schema"),
}));
vi.mock("@/lib/auth/admin", () => ({
  requireAdmin: async () => {
    if (!context.admin) throw new Error("unauthorized");
  },
  isAdmin: async () => context.admin,
}));
vi.mock("next/cache", () => ({ revalidatePath: (path: string) => context.paths.push(path) }));
import {
  changeProductPublication,
  parseProductForm,
  saveProductRecord,
  getProductCommerce,
} from "./products";
import { MAX_PHOTO_BYTES, prepareProductPhoto, storedPhotoBytes } from "./product-images";
import { listCatalogForUi } from "@/lib/db/repos/catalog";
import { GET as getPhoto } from "@/app/api/product-images/[id]/route";
import { getCatalog } from "@/lib/catalog/load";
import { saveManagedProductAction, setProductPublicationAction } from "@/app/_actions/products";
import { importProductCsv, previewProductCsv, validateProductCsv } from "./product-csv";
import { importAiDrafts } from "./ai-products";
const pg = new PGlite(),
  db = drizzle(pg, { schema });
beforeAll(async () => {
  context.db = db;
  for (const file of (await readdir("drizzle")).filter((file) => file.endsWith(".sql")).sort())
    await pg.exec(await readFile(`drizzle/${file}`, "utf8"));
}, 30000);
afterAll(async () => {
  await pg.close();
});
function baseForm(name: string, published = false) {
  const form = new FormData();
  for (const [key, value] of Object.entries({
    name,
    brand: "Marca de prueba",
    slug: name.toLowerCase().replace(/ /g, "-"),
    category: "ram",
    source: "https://example.test/ficha",
    tdpW: "5",
  }))
    form.set(key, value);
  if (published) form.set("isActive", "on");
  return form;
}
function completeRam(form: FormData) {
  const spec = makeCompatibleBuild().ram[0]!.spec;
  for (const field of getSpecFields("ram")) {
    const value = specValue(spec, field.path);
    if (value !== undefined) form.set(`spec.${field.path}`, String(value));
  }
  return form;
}
async function currentVersion(id: string) {
  const [row] = await db.select().from(schema.components).where(eq(schema.components.id, id));
  return row!.updatedAt.toISOString();
}
describe.sequential("Administración de productos con PostgreSQL aislado", () => {
  let id: string, firstImage: string;
  it("guarda propuestas de IA como borradores y rechaza duplicados sin importar parcialmente", async () => {
    const draft = {
      name: "RAM IA aislada",
      brand: "Kingston",
      category: "ram",
      source: "https://www.kingston.com/product",
      fields: { capacityGb: "32" },
      isActive: true,
      priceAmount: "1",
    };
    expect(await importAiDrafts([draft])).toBe(1);
    const [row] = await db
      .select()
      .from(schema.components)
      .where(eq(schema.components.slug, "ram-ia-aislada"));
    expect(row?.isActive).toBe(false);
    expect(row?.spec).toMatchObject({ capacityGb: 32 });
    expect(
      await db.select().from(schema.prices).where(eq(schema.prices.componentId, row!.id)),
    ).toHaveLength(0);
    await expect(importAiDrafts([{ ...draft, name: "RAM IA nueva" }, draft])).rejects.toThrow(
      "Ya existen",
    );
    expect(
      await db.select().from(schema.components).where(eq(schema.components.slug, "ram-ia-nueva")),
    ).toHaveLength(0);
    await expect(
      importAiDrafts([
        { ...draft, name: "RAM IA desconocida", fields: { "__proto__.polluted": "true" } },
      ]),
    ).rejects.toThrow("campos");
  });
  it("crea producto y tienda con precio propio, mantiene historial y permite retirarlo", async () => {
    const form = completeRam(baseForm("Precio integrado prueba", true));
    form.set("priceMode", "priced");
    form.set("priceAmount", "850.00");
    form.set("priceStockQty", "4");
    form.set("priceInStock", "on");
    await expect(saveProductRecord(form)).rejects.toThrow("primer precio");
    expect(
      await db
        .select()
        .from(schema.components)
        .where(eq(schema.components.slug, "precio-integrado-prueba")),
    ).toHaveLength(0);
    form.set("ownStoreName", "Tienda propia aislada");
    form.set("ownStoreCity", "Ciudad de prueba");
    const result = await saveProductRecord(form);
    let commerce = await getProductCommerce(result.id);
    expect(commerce.store?.name).toBe("Tienda propia aislada");
    expect(commerce.amount).toBe("850.00");
    await db
      .update(schema.prices)
      .set({ observedAt: new Date("2025-01-01") })
      .where(eq(schema.prices.componentId, result.id));
    expect((await listCatalogForUi()).find((row) => row.id === result.id)?.priceBob).toBe(850);
    // A technical edit must not create duplicate observations.
    form.set("id", result.id);
    form.set("version", await currentVersion(result.id));
    form.set("priceVersion", commerce.version);
    await saveProductRecord(form);
    expect(
      await db.select().from(schema.prices).where(eq(schema.prices.componentId, result.id)),
    ).toHaveLength(1);
    form.set("version", await currentVersion(result.id));
    form.set("priceAmount", "900.50");
    await saveProductRecord(form);
    commerce = await getProductCommerce(result.id);
    expect(commerce.amount).toBe("900.50");
    const stale = form.get("priceVersion");
    form.set("version", await currentVersion(result.id));
    await expect(saveProductRecord(form)).rejects.toThrow("El precio cambió");
    expect(form.get("priceVersion")).toBe(stale);
    form.set("priceVersion", commerce.version);
    form.set("priceStockQty", "0");
    form.delete("priceInStock");
    await saveProductRecord(form);
    expect((await getProductCommerce(result.id)).amount).toBe("900.50");
    expect((await listCatalogForUi()).find((row) => row.id === result.id)?.priceBob).toBeNull();
    form.set("version", await currentVersion(result.id));
    form.set("priceVersion", (await getProductCommerce(result.id)).version);
    form.set("priceMode", "quote");
    await saveProductRecord(form);
    expect((await getProductCommerce(result.id)).mode).toBe("quote");
    expect((await listCatalogForUi()).find((row) => row.id === result.id)?.priceBob).toBeNull();
    expect(
      await db.select().from(schema.prices).where(eq(schema.prices.componentId, result.id)),
    ).toHaveLength(4);
  });
  it("rechaza precio inválido y errores de tienda sin dejar un producto parcial", async () => {
    for (const amount of ["0", "-1", "0.001", "abc", "1000001"]) {
      const form = baseForm("Precio invalido integrado");
      form.set("priceMode", "priced");
      form.set("priceAmount", amount);
      await expect(saveProductRecord(form)).rejects.toThrow("precio");
    }
    const form = baseForm("Stock invalido integrado");
    form.set("priceMode", "priced");
    form.set("priceAmount", "850");
    form.set("priceStockQty", "0");
    form.set("priceInStock", "on");
    await expect(saveProductRecord(form)).rejects.toThrow("cantidad cero");
    const [store] = await db.select().from(schema.stores).where(eq(schema.stores.isOwn, true));
    await db.update(schema.stores).set({ isActive: false }).where(eq(schema.stores.id, store!.id));
    form.set("priceStockQty", "2");
    await expect(saveProductRecord(form)).rejects.toThrow("desactivada");
    expect(
      await db
        .select()
        .from(schema.components)
        .where(eq(schema.components.slug, "stock-invalido-integrado")),
    ).toHaveLength(0);
    await db.update(schema.stores).set({ isActive: true }).where(eq(schema.stores.id, store!.id));
  });
  it("importa CSV como borradores y rechaza conflictos sin guardar filas parciales", async () => {
    const upload = (rows: string) => {
      const form = new FormData();
      form.set(
        "csv",
        new File([`\uFEFFnombre;marca;identificador;categoria\r\n${rows}`], "productos.csv"),
      );
      return form;
    };
    const first = upload(
      '"RAM; especial";Kingston;csv-integracion-a;ram\r\nRAM segunda;Kingston;csv-integracion-b;ram',
    );
    expect(await previewProductCsv(first)).toHaveLength(2);
    expect(await importProductCsv(first)).toBe(2);
    const [row] = await db
      .select()
      .from(schema.components)
      .where(eq(schema.components.slug, "csv-integracion-a"));
    expect(row?.nameDisplay).toBe("RAM; especial");
    expect(row?.isActive).toBe(false);
    const conflict = upload(
      "RAM nueva;Kingston;csv-integracion-c;ram\r\nRAM existente;Kingston;csv-integracion-a;ram",
    );
    await expect(previewProductCsv(conflict)).rejects.toThrow("ya existen");
    await expect(importProductCsv(conflict)).rejects.toThrow("No se importó ningún producto");
    expect(
      await db
        .select()
        .from(schema.components)
        .where(eq(schema.components.slug, "csv-integracion-c")),
    ).toHaveLength(0);
    expect(() => validateProductCsv('nombre;marca;identificador;categoria\n"sin cerrar')).toThrow(
      "comillas sin cerrar",
    );
  });
  it("cada categoría permite reconstruir sus datos sin JSON y sin valores inventados", () => {
    const build = makeCompatibleBuild();
    const fixtures = {
      cpu: build.cpu!.spec,
      gpu: build.gpu!.spec,
      mobo: build.mobo!.spec,
      ram: build.ram[0]!.spec,
      storage: build.storage[0]!.spec,
      psu: build.psu!.spec,
      case: build.case!.spec,
      cooler_air: build.coolerAir!.spec,
      cooler_aio: {
        radiatorSizeMm: 240,
        tdpW: 200,
        socketSupport: ["AM5"],
        pumpSpeedRpm: 2500,
        tubeLengthMm: 400,
        fanCount: 2,
        rgbSupport: "none",
      },
    };
    for (const category of PRODUCT_CATEGORIES) {
      expect(getSpecFields(category.key).length).toBeGreaterThan(0);
      const spec = fixtures[category.key as keyof typeof fixtures];
      if (!spec) continue;
      const form = baseForm("Ficha prueba", true);
      form.set("category", category.key);
      for (const field of getSpecFields(category.key)) {
        const value = specValue(spec, field.path);
        if (value !== undefined && value !== null)
          form.set(`spec.${field.path}`, Array.isArray(value) ? value.join(", ") : String(value));
      }
      expect(() => parseProductForm(form)).not.toThrow();
    }
  });
  it("guarda un borrador incompleto y no lo muestra en el catálogo", async () => {
    const result = await saveProductRecord(baseForm("Producto administrativo prueba"));
    id = result.id;
    expect(result.published).toBe(false);
    expect((await listCatalogForUi()).some((row) => row.id === id)).toBe(false);
    await expect(changeProductPublication(id, true, await currentVersion(id))).rejects.toThrow(
      "completá",
    );
  });
  it("publica una ficha completa con foto persistente fuera de los ocho slugs iniciales", async () => {
    const photo = await sharp({
      create: { width: 120, height: 90, channels: 3, background: "#abcdef" },
    })
      .png()
      .toBuffer();
    const form = completeRam(baseForm("Producto administrativo prueba", true));
    form.set("id", id);
    form.set("version", await currentVersion(id));
    form.set("photo", new File([new Uint8Array(photo)], "producto.png", { type: "image/png" }));
    form.set("photoAlt", "Producto de prueba aislada");
    await saveProductRecord(form);
    const published = (await listCatalogForUi()).find((row) => row.id === id)!;
    expect(published).toBeDefined();
    expect(published.image).toMatch(/^\/api\/product-images\//);
    expect(JSON.stringify(published)).not.toContain("base64");
    const [image] = await db
      .select()
      .from(schema.componentImages)
      .where(eq(schema.componentImages.componentId, id));
    firstImage = image!.id;
    expect(storedPhotoBytes(image!.url)).not.toBeNull();
    expect(image!.altEs).toBe("Producto de prueba aislada");
    const response = await getPhoto(
      new Request("http://localhost/api/product-images/" + firstImage),
      { params: Promise.resolve({ id: firstImage }) },
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/webp");
  });
  it("rechaza ediciones obsoletas y no cambia el identificador ni la categoría", async () => {
    const version = await currentVersion(id);
    const form = completeRam(baseForm("Producto administrativo prueba", true));
    form.set("id", id);
    form.set("version", version);
    await changeProductPublication(id, false, version);
    await expect(saveProductRecord(form)).rejects.toThrow("cambió");
    form.set("version", await currentVersion(id));
    form.set("slug", "otro-identificador");
    await expect(saveProductRecord(form)).rejects.toThrow("no se pueden cambiar");
  });
  it("desactivar conserva el producto y sus fotos sin aparecer en catálogo", async () => {
    expect((await listCatalogForUi()).some((row) => row.id === id)).toBe(false);
    expect(
      await db.select().from(schema.components).where(eq(schema.components.id, id)),
    ).toHaveLength(1);
    expect(
      await db
        .select()
        .from(schema.componentImages)
        .where(eq(schema.componentImages.componentId, id)),
    ).toHaveLength(1);
    context.admin = false;
    expect(
      (
        await getPhoto(new Request("http://localhost"), {
          params: Promise.resolve({ id: firstImage }),
        })
      ).status,
    ).toBe(404);
    context.admin = true;
    const privatePhoto = await getPhoto(new Request("http://localhost"), {
      params: Promise.resolve({ id: firstImage }),
    });
    expect(privatePhoto.status).toBe(200);
    expect(privatePhoto.headers.get("cache-control")).toContain("private");
  });
  it("reemplazar y quitar fotos no deja metadatos de la foto anterior", async () => {
    const photo = await sharp({
      create: { width: 100, height: 100, channels: 3, background: "#fafafa" },
    })
      .webp()
      .toBuffer();
    const form = completeRam(baseForm("Producto administrativo prueba", true));
    form.set("id", id);
    form.set("version", await currentVersion(id));
    form.set("photo", new File([new Uint8Array(photo)], "otra.webp"));
    await saveProductRecord(form);
    const photos = await db
      .select()
      .from(schema.componentImages)
      .where(eq(schema.componentImages.componentId, id));
    expect(photos).toHaveLength(1);
    expect(photos[0]!.id).not.toBe(firstImage);
    form.delete("photo");
    form.set("removePhoto", "on");
    form.set("version", await currentVersion(id));
    await saveProductRecord(form);
    expect(
      await db
        .select()
        .from(schema.componentImages)
        .where(eq(schema.componentImages.componentId, id)),
    ).toHaveLength(0);
  });
  it("una foto inválida no crea el producto ni publica cambios parciales", async () => {
    const form = completeRam(baseForm("Foto invalida prueba", true));
    form.set("photo", new File(["<svg onload='alert(1)'/>"], "foto.png", { type: "image/png" }));
    await expect(saveProductRecord(form)).rejects.toThrow("contenido");
    expect(
      await db
        .select()
        .from(schema.components)
        .where(eq(schema.components.slug, "foto-invalida-prueba")),
    ).toHaveLength(0);
    await expect(
      prepareProductPhoto(new File([new Uint8Array(MAX_PHOTO_BYTES + 1)], "grande.png")),
    ).rejects.toThrow("3 MB");
  });
  it("las acciones exigen administrador y devuelven errores de ficha sin descartar datos", async () => {
    context.admin = false;
    await expect(saveManagedProductAction(baseForm("No autorizado"))).rejects.toThrow(
      "unauthorized",
    );
    await expect(setProductPublicationAction(new FormData())).rejects.toThrow("unauthorized");
    context.admin = true;
    const result = await saveManagedProductAction(baseForm("Ficha incompleta", true));
    expect(result.ok).toBe(false);
    expect(result.fields).toBeDefined();
    const success = await saveManagedProductAction(baseForm("Borrador accion prueba"));
    expect(success.ok).toBe(true);
    expect(context.paths).toContain("/catalog");
  });
  it("no acepta listas de opciones falsas ni números inválidos", () => {
    const form = baseForm("Mal dato");
    form.set("spec.kitQty", "3");
    expect(() => parseSpecFields("ram", form)).toThrow("Revisá");
    const storage = baseForm("Mal lista");
    storage.set("spec.memorySupport", "DDR9");
    expect(() => parseSpecFields("cpu", storage)).toThrow("Revisá");
  });
  it("el botón del listado también rechaza una ficha sin formatos compatibles", async () => {
    const form = baseForm("CPU incompleta prueba");
    form.set("category", "cpu");
    for (const field of getSpecFields("cpu")) {
      const value = specValue(makeCompatibleBuild().cpu!.spec, field.path);
      if (value !== undefined)
        form.set(`spec.${field.path}`, Array.isArray(value) ? value.join(", ") : String(value));
    }
    form.set("spec.memorySupport", "");
    const result = await saveProductRecord(form);
    await expect(
      changeProductPublication(result.id, true, await currentVersion(result.id)),
    ).rejects.toThrow("completá");
  });
  it("el catálogo conectado admite productos nuevos y no revive ejemplos cuando queda vacío", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://isolated-test");
    try {
      expect((await getCatalog()).some((row) => row.id === id)).toBe(true);
      await db.update(schema.components).set({ isActive: false });
      expect(await getCatalog()).toEqual([]);
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
