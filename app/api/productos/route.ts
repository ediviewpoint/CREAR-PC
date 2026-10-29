import { requireSession } from "@/lib/auth";
import { apiError, readJson } from "@/lib/api-errors";
import { saveProduct } from "@/lib/productos/guardar";
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
export async function POST(request: Request) {
  try {
    const session = await requireSession("EDITOR");
    return Response.json(await saveProduct(await readJson(request), session.user), { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
