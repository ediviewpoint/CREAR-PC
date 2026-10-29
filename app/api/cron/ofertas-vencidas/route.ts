import { cronAuthorized } from "@/lib/cron/auth";
import { prisma } from "@/lib/prisma";
export async function GET(request: Request) {
  if (!cronAuthorized(request))
    return Response.json(
      { error: { code: "NO_AUTORIZADO", message: "No autorizado" } },
      { status: 401 },
    );
  const expired = await prisma.producto.findMany({
    where: { precioOferta: { not: null }, ofertaHasta: { lt: new Date() } },
    select: { id: true, precioOferta: true },
  });
  let updated = 0;
  for (const product of expired)
    await prisma.$transaction(async (tx) => {
      const result = await tx.producto.updateMany({
        where: {
          id: product.id,
          precioOferta: product.precioOferta,
          ofertaHasta: { lt: new Date() },
        },
        data: { precioOferta: null, etiquetaDescuento: null, actualizadoPorId: "sistema" },
      });
      if (result.count) {
        await tx.productoHistorial.create({
          data: {
            productoId: product.id,
            usuarioId: "sistema",
            accion: "editar",
            origen: "oferta_vencida",
            cambios: [{ campo: "precioOferta", antes: product.precioOferta, despues: null }],
          },
        });
        updated++;
      }
    });
  return Response.json({ actualizados: updated });
}
