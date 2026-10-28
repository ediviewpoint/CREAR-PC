"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import {
  requireAdmin,
  passwordMatches,
  startAdminSession,
  endAdminSession,
} from "@/lib/auth/admin";
import { rateLimit, clientKey } from "@/lib/rate-limit";
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
  if (slug.length < 2)
    return { message: "El nombre y la ciudad no permiten generar un identificador válido." };
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
      sourceUrl: z.url().refine((value) => /^https?:\/\//.test(value)),
      stockQty: z.coerce.number().int().min(0).max(1000000).nullable(),
    })
    .safeParse({
      ...Object.fromEntries(form),
      stockQty: form.get("stockQty") === "" || !form.has("stockQty") ? null : form.get("stockQty"),
    });
  if (!input.success) return { message: "Revisá componente, tienda, precio positivo y fuente." };
  if (form.get("inStock") === "on" && input.data.stockQty === 0)
    return { message: "Con cantidad cero, desmarcá Disponible en tienda." };
  try {
    const [store] = await getDb()
      .select({ active: schema.stores.isActive, own: schema.stores.isOwn })
      .from(schema.stores)
      .where(eq(schema.stores.id, input.data.storeId));
    if (!store?.active) return { message: "Elegí una tienda activa." };
    if (store.own)
      return {
        message:
          "Actualizá el precio de tu tienda desde la ficha del producto para guardar también su disponibilidad.",
      };
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
