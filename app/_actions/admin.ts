"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import {
  requireAdmin,
  passwordMatches,
  startAdminSession,
  endAdminSession,
} from "@/lib/auth/admin";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { normalizeComponent } from "@/lib/catalog/normalize";
import { componentCategory } from "@/lib/schemas/components";
export type AdminState = { message: string };
export async function loginAdminAction(_: AdminState, form: FormData): Promise<AdminState> {
  const h = await headers();
  if (
    !rateLimit(clientKey(h.get("x-forwarded-for"), "admin-login"), { limit: 5, windowMs: 900000 })
      .success
  )
    return { message: "Demasiados intentos. Esperá unos minutos." };
  if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.length < 16)
    return {
      message: "Configurá ADMIN_PASSWORD con al menos 16 caracteres en el entorno del servidor.",
    };
  if (!passwordMatches(String(form.get("password") ?? "")))
    return { message: "La contraseña no es válida." };
  await startAdminSession();
  redirect("/admin");
}
export async function logoutAdminAction() {
  await endAdminSession();
  redirect("/admin/login");
}
function toSlug(parts: string[]) {
  return parts
    .join("-")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function saveStoreAction(_: AdminState, form: FormData): Promise<AdminState> {
  await requireAdmin();
  const input = z
    .object({
      name: z.string().trim().min(1).max(120),
      city: z.string().trim().min(1).max(80),
      website: z.url().optional(),
    })
    .safeParse({
      name: form.get("name"),
      city: form.get("city"),
      website: form.get("website") || undefined,
    });
  if (!input.success) return { message: "Revisá nombre, ciudad y URL de la tienda." };
  const slug = toSlug([input.data.name, input.data.city]);
  if (slug.length < 2) return { message: "El nombre y la ciudad no permiten generar un identificador válido." };
  try {
    await getDb()
      .insert(schema.stores)
      .values({ ...input.data, slug, isActive: true });
    revalidatePath("/admin", "layout");
    return { message: "Tienda guardada." };
  } catch {
    return { message: "No se pudo guardar. Comprobá la conexión y las migraciones." };
  }
}
export async function savePriceAction(_: AdminState, form: FormData): Promise<AdminState> {
  await requireAdmin();
  const input = z
    .object({
      componentId: z.uuid(),
      storeId: z.uuid(),
      amount: z.coerce.number().positive().max(1000000),
      sourceUrl: z.url(),
    })
    .safeParse(Object.fromEntries(form));
  if (!input.success) return { message: "Revisá componente, tienda, precio positivo y fuente." };
  try {
    await getDb()
      .insert(schema.prices)
      .values({
        ...input.data,
        amount: input.data.amount.toFixed(2),
        currency: "BOB",
        inStock: form.get("inStock") === "on",
        observedAt: new Date(),
      });
    revalidatePath("/catalog");
    revalidatePath("/build");
    revalidatePath("/admin", "layout");
    return { message: "Cotización registrada. Se conserva el historial anterior." };
  } catch {
    return { message: "No se pudo registrar la cotización. Revisá conexión y referencias." };
  }
}
export async function saveComponentAction(_: AdminState, form: FormData): Promise<AdminState> {
  await requireAdmin();
  try {
    const kind = componentCategory.parse(form.get("category")),
      slug = z
        .string()
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .max(120)
        .parse(form.get("slug")),
      brand = z.string().trim().min(1).max(60).parse(form.get("brand")),
      name = z.string().trim().min(1).max(180).parse(form.get("name")),
      sourceUrl = z.url().parse(form.get("source"));
    const component = normalizeComponent(
      {
        slug,
        brand,
        name_display: name,
        spec: JSON.parse(String(form.get("spec"))),
        sources: [{ url: sourceUrl, fetchedAt: new Date().toISOString() }],
      },
      kind,
    );
    if (!component)
      return { message: "Las especificaciones no cumplen el esquema de la categoría." };
    await getDb()
      .insert(schema.components)
      .values({
        slug,
        brand,
        model: name.slice(0, 120),
        nameDisplay: name,
        category: kind,
        spec: component.selection.item.spec,
        tdpW: component.selection.item.tdpW,
        sources: component.sources,
      });
    revalidatePath("/admin", "layout");
    revalidatePath("/catalog");
    revalidatePath("/build");
    return { message: "Componente guardado." };
  } catch {
    return { message: "No se pudo guardar: revisá JSON, campos, slug único y conexión." };
  }
}
