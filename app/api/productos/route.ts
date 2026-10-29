import { requireSession } from "@/lib/auth";
import { apiError } from "@/lib/api-errors";
import { listProducts } from "@/lib/productos/listar";
export async function GET(request: Request) {
  try {
    await requireSession("LECTOR");
    return Response.json(
      await listProducts(Object.fromEntries(new URL(request.url).searchParams)),
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
