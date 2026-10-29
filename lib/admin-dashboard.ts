import "server-only";
import { prisma } from "@/lib/prisma";
export async function getDashboard() {
  // DECISION: semana comercial desde lunes 00:00 en Bolivia, sin cambio de huso por verano.
  const now = new Date(Date.now() - 4 * 3600000);
  const monday = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - ((now.getUTCDay() + 6) % 7),
      4,
    ),
  );
  const visible = { deletedAt: null, estado: "publicado" };
  const [total, exhausted, created, low, recent, incomplete] = await Promise.all([
    prisma.producto.count({ where: visible }),
    prisma.producto.count({ where: { ...visible, disponibilidad: "SIN_STOCK" } }),
    prisma.producto.count({ where: { deletedAt: null, createdAt: { gte: monday } } }),
    prisma.$queryRaw<
      { count: bigint }[]
    >`SELECT COUNT(*) AS count FROM "Producto" p WHERE p."deletedAt" IS NULL AND p."estado" = 'publicado' AND p."controlaInventario" = true AND p."disponibilidad" <> 'BAJO_PEDIDO' AND COALESCE((SELECT SUM(s."cantidad") FROM "StockSucursal" s WHERE s."productoId"=p.id),0) BETWEEN 1 AND COALESCE(p."umbralStockBajo", (SELECT (valor::text)::int FROM "Configuracion" WHERE clave='umbralStockBajo'),2)`,
    prisma.producto.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: { id: true, sku: true, titulo: true, updatedAt: true },
    }),
    prisma.producto.findMany({
      where: {
        deletedAt: null,
        OR: [
          { requiereRevision: true },
          { imagenes: { none: {} } },
          { tipo: "CARRITO", precioSinFactura: null, precioConFactura: null },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: {
        id: true,
        sku: true,
        titulo: true,
        requiereRevision: true,
        precioSinFactura: true,
        precioConFactura: true,
        tipo: true,
        _count: { select: { imagenes: true } },
      },
    }),
  ]);
  return { total, exhausted, created, low: Number(low[0]?.count || 0), recent, incomplete };
}
