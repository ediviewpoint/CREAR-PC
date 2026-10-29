import { requireSession } from "@/lib/auth";
import { apiError, readJson } from "@/lib/api-errors";
import { reorderProduct } from "@/lib/productos/mutaciones";
export async function PATCH(request: Request) {
  try {
    const session = await requireSession("EDITOR");
    return Response.json(await reorderProduct(await readJson(request), session.user));
  } catch (error) {
    return apiError(error);
  }
}
