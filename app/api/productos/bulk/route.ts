import { requireSession } from "@/lib/auth";
import { apiError, readJson } from "@/lib/api-errors";
import { bulkProducts } from "@/lib/productos/bulk";
export async function POST(request: Request) {
  try {
    const session = await requireSession("EDITOR");
    return Response.json(await bulkProducts(await readJson(request), session.user));
  } catch (error) {
    return apiError(error);
  }
}
