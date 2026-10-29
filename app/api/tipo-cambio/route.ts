import { requireSession } from "@/lib/auth";
import { apiError } from "@/lib/api-errors";
import { getExchangeRate } from "@/lib/configuracion";
export async function GET() {
  try {
    await requireSession();
    return Response.json(await getExchangeRate(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiError(error);
  }
}
