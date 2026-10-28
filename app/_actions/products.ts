"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import {
  changeProductPublication,
  ProductInputError,
  saveProductRecord,
  duplicateProductRecord,
} from "@/lib/admin/products";
export type ProductActionState = {
  ok: boolean;
  message: string;
  id?: string;
  fields?: Record<string, string>;
};
function invalidateProducts() {
  revalidatePath("/admin", "layout");
  revalidatePath("/catalog", "layout");
  revalidatePath("/build", "layout");
  revalidatePath("/sitemap.xml");
}
function failure(error: unknown): ProductActionState {
  if (error instanceof ProductInputError)
    return { ok: false, message: error.message, fields: error.fields };
  const code =
    (error as { code?: string; cause?: { code?: string } })?.cause?.code ??
    (error as { code?: string })?.code;
  return {
    ok: false,
    message:
      code === "23505"
        ? "Ese identificador ya existe. Elegí otro para este producto."
        : "No se pudo guardar. Conservamos tus datos en el formulario; comprobá la conexión e intentá otra vez.",
  };
}
export async function saveManagedProductAction(form: FormData): Promise<ProductActionState> {
  await requireAdmin();
  try {
    const result = await saveProductRecord(form);
    invalidateProducts();
    return {
      ok: true,
      id: result.id,
      message: result.published
        ? "Producto guardado y publicado en el catálogo."
        : "Borrador guardado. Todavía no aparece en el catálogo.",
    };
  } catch (error) {
    return failure(error);
  }
}
export async function setProductPublicationAction(form: FormData): Promise<ProductActionState> {
  await requireAdmin();
  try {
    const result = await changeProductPublication(
      String(form.get("id") ?? ""),
      form.get("publish") === "true",
      String(form.get("version") ?? ""),
    );
    invalidateProducts();
    return {
      ok: true,
      id: result.id,
      message: result.published
        ? "Producto publicado."
        : "Producto desactivado. Se conservan el registro y las cotizaciones anteriores.",
    };
  } catch (error) {
    return failure(error);
  }
}

export async function duplicateManagedProductAction(id:string):Promise<ProductActionState> {
  await requireAdmin();
  try { const result=await duplicateProductRecord(id);invalidateProducts();return {ok:true,id:result.id,message:"Copia creada como borrador. Revisá modelo, ficha y garantía; añadí sus fotos y precio."}; }
  catch(error){return failure(error);}
}
