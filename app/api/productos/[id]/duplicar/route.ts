import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { apiError } from "@/lib/api-errors";
import { duplicateProduct } from "@/lib/productos/duplicar";
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession("EDITOR");
    return Response.json(
      await duplicateProduct(
        z
          .string()
          .min(1)
          .max(100)
          .parse((await params).id),
        session.user,
      ),
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}
