import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { apiError } from "@/lib/api-errors";
import { productHistory } from "@/lib/productos/historial";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    return Response.json({
      items: await productHistory(
        session.user.rol,
        z
          .string()
          .min(1)
          .max(100)
          .parse((await params).id),
      ),
    });
  } catch (error) {
    return apiError(error);
  }
}
