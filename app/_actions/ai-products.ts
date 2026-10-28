"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import {
  generateAiProducts,
  importAiDrafts,
  ProductAiError,
  type AiProductDraft,
} from "@/lib/admin/ai-products";
import { ProductInputError } from "@/lib/admin/products";
export type AiActionState = {
  ok: boolean;
  message: string;
  products?: AiProductDraft[];
  imported?: number;
};
export async function suggestProductsAction(input: unknown): Promise<AiActionState> {
  await requireAdmin();
  const h = await headers();
  if (
    !rateLimit(clientKey(h.get("x-forwarded-for"), "ai-products"), { limit: 20, windowMs: 3600000 })
      .success ||
    !rateLimit("ai-products:instance", { limit: 40, windowMs: 3600000 }).success
  )
    return {
      ok: false,
      message:
        "Se alcanzó el límite de consultas de IA de esta hora. Podés seguir completando fichas manualmente.",
    };
  try {
    const products = await generateAiProducts(input);
    return {
      ok: true,
      message: "Revisá las propuestas. Todavía no se guardaron cambios.",
      products,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof ProductAiError
          ? error.message
          : "No se pudo preparar la ficha. Conservamos el texto para que puedas intentar otra vez.",
    };
  }
}
export async function saveAiDraftsAction(input: unknown): Promise<AiActionState> {
  await requireAdmin();
  try {
    const imported = await importAiDrafts(input);
    revalidatePath("/admin", "layout");
    return {
      ok: true,
      message: `${imported} productos guardados como borradores. Revisá las fichas y agregá fotos, garantía y precios antes de publicarlos.`,
      imported,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof ProductInputError
          ? error.message
          : "No se pudieron guardar los borradores. Comprobá si ya existen antes de intentar de nuevo; no se guardan tandas parciales.",
    };
  }
}
