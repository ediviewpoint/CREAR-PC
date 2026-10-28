"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { importProductCsv, previewProductCsv } from "@/lib/admin/product-csv";
import { ProductInputError } from "@/lib/admin/products";
export type CsvActionState = {
  ok: boolean;
  message: string;
  preview?: { name: string; slug: string; category: string }[];
  imported?: number;
};
export async function productCsvAction(form: FormData, confirm = false): Promise<CsvActionState> {
  await requireAdmin();
  try {
    if (!confirm) {
      const products = await previewProductCsv(form);
      return {
        ok: true,
        message: `${products.length} productos válidos. Se crearán como borradores, sin fotos ni precios.`,
        preview: products.map((item) => ({
          name: item.name,
          slug: item.slug,
          category: item.category,
        })),
      };
    }
    const count = await importProductCsv(form);
    revalidatePath("/admin", "layout");
    return {
      ok: true,
      message: `Se importaron ${count} productos como borradores. Revisá sus fichas, añadí fotos y precios y publicá cuando estén listos.`,
      imported: count,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof ProductInputError
          ? error.message
          : "No se pudo importar. Comprobá la conexión y que los identificadores no existan ya. No se guardaron cambios parciales.",
    };
  }
}
