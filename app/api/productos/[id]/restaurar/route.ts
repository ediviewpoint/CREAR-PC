import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { apiError, ApiError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession("ADMIN");
    const id = z
      .string()
      .min(1)
      .max(100)
      .parse((await params).id);
    await prisma.$transaction(async (tx) => {
      const product = await tx.producto.findUnique({ where: { id } });
      if (!product?.deletedAt || Date.now() - product.deletedAt.getTime() > 30 * 86400000)
        throw new ApiError(
          "NO_ENCONTRADO",
          "El producto no se puede restaurar; el plazo es de 30 días",
          404,
        );
      await tx.producto.update({
        where: { id },
        data: { deletedAt: null, actualizadoPorId: session.user.id },
      });
      await tx.productoHistorial.create({
        data: {
          productoId: id,
          usuarioId: session.user.id,
          accion: "restaurar",
          cambios: [{ campo: "deletedAt", antes: product.deletedAt.toISOString(), despues: null }],
        },
      });
    });
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
