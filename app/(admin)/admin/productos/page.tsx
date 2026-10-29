import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { TablaProductos } from "@/components/productos/TablaProductos";
export const metadata = { title: "Productos · ElitePC" };
export default async function Products() {
  const session = await requireSession();
  const [categories, brands, user] = await Promise.all([
    prisma.categoria.findMany({
      orderBy: { orden: "asc" },
      select: {
        id: true,
        nombre: true,
        padreId: true,
        _count: {
          select: { productos: { where: { deletedAt: null, estado: { not: "archivado" } } } },
        },
      },
    }),
    prisma.marca.findMany({
      where: { productos: { some: { deletedAt: null } } },
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true },
    }),
    prisma.usuario.findUniqueOrThrow({
      where: { id: session.user.id },
      select: { preferencias: true },
    }),
  ]);
  const preferences =
    user.preferencias && typeof user.preferencias === "object" && !Array.isArray(user.preferencias)
      ? user.preferencias
      : {};
  const raw = preferences.columnasProductos;
  const columns: Record<string, boolean> = { precioConFactura: false, precioUsd: false };
  if (raw && typeof raw === "object" && !Array.isArray(raw))
    for (const [key, value] of Object.entries(raw))
      if (typeof value === "boolean") columns[key] = value;
  return (
    <TablaProductos
      categories={categories.map((v) => ({
        id: v.id,
        nombre: v.nombre,
        padreId: v.padreId,
        total: v._count.productos,
      }))}
      brands={brands}
      role={session.user.rol}
      initialColumns={columns}
    />
  );
}
