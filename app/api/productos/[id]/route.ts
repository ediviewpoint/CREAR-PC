import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { apiError, readJson } from "@/lib/api-errors";
import { quickPatch, softDelete } from "@/lib/productos/mutaciones";
import { getProduct, saveProduct } from "@/lib/productos/guardar";
const Id = z.string().min(1).max(100);
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, { params }: Context) {
  try {
    const session = await requireSession();
    return Response.json(await getProduct(Id.parse((await params).id), session.user.rol));
  } catch (error) {
    return apiError(error);
  }
}
export async function PUT(request: Request, { params }: Context) {
  try {
    const session = await requireSession("EDITOR");
    return Response.json(
      await saveProduct(await readJson(request), session.user, Id.parse((await params).id)),
    );
  } catch (error) {
    return apiError(error);
  }
}
export async function PATCH(request: Request, { params }: Context) {
  try {
    const session = await requireSession("VENDEDOR");
    const id = Id.parse((await params).id);
    return Response.json(await quickPatch(id, await readJson(request), session.user));
  } catch (error) {
    return apiError(error);
  }
}
export async function DELETE(_request: Request, { params }: Context) {
  try {
    const session = await requireSession("ADMIN");
    return Response.json(await softDelete(Id.parse((await params).id), session.user));
  } catch (error) {
    return apiError(error);
  }
}
