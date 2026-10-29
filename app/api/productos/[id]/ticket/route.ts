import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { apiError, ApiError, readJson } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { checkWriteRate } from "@/lib/productos/mutaciones";
const Input = z.object({
  ticket: z.string().trim().min(1).max(100),
  sucursalId: z.string().min(1).max(100),
  cantidad: z.number().int().min(1).max(99999),
});
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession("EDITOR");
    const id = (await params).id;
    const input = Input.parse(await readJson(request));
    const result = await prisma.$transaction(async (tx) => {
      await checkWriteRate(tx, session.user);
      await tx.$queryRaw`SELECT id FROM "Producto" WHERE id = ${id} FOR UPDATE`;
      const p = await tx.producto.findUnique({ where: { id }, include: { stocks: true } });
      if (!p || p.deletedAt) throw new ApiError("NO_ENCONTRADO", "El producto no existe", 404);
      if (!p.controlaInventario)
        throw new ApiError(
          "VALIDACION",
          "Activa el control de inventario para descontar repuestos",
          422,
        );
      const stock = p.stocks.find((v) => v.sucursalId === input.sucursalId);
      if (!stock || stock.cantidad < input.cantidad)
        throw new ApiError("VALIDACION", "No hay stock suficiente en esta sucursal", 422);
      await tx.stockSucursal.update({
        where: { productoId_sucursalId: { productoId: id, sucursalId: input.sucursalId } },
        data: { cantidad: { decrement: input.cantidad } },
      });
      const total = p.stocks.reduce((sum, v) => sum + v.cantidad, 0) - input.cantidad;
      await tx.producto.update({
        where: { id },
        data: {
          actualizadoPorId: session.user.id,
          ...(total === 0 && p.disponibilidad !== "BAJO_PEDIDO"
            ? { disponibilidad: "SIN_STOCK", stockAutomatico: true }
            : {}),
        },
      });
      await tx.productoHistorial.create({
        data: {
          productoId: id,
          usuarioId: session.user.id,
          accion: "ticket",
          origen: input.ticket,
          cambios: [
            {
              campo: `stock:${input.sucursalId}`,
              antes: stock.cantidad,
              despues: stock.cantidad - input.cantidad,
            },
          ],
        },
      });
      return { stockTotal: total };
    });
    return Response.json(result);
  } catch (error) {
    return apiError(error);
  }
}
