import "server-only";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/lib/auth-permissions";
export async function productHistory(
  role: UserRole,
  productoId?: string,
  filters?: { usuarioId?: string; accion?: string; desde?: Date; hasta?: Date },
) {
  const items = await prisma.productoHistorial.findMany({
    where: {
      ...(productoId ? { productoId } : {}),
      ...(filters?.usuarioId ? { usuarioId: filters.usuarioId } : {}),
      ...(filters?.accion ? { accion: filters.accion } : {}),
      ...(filters?.desde || filters?.hasta
        ? { createdAt: { gte: filters?.desde, lte: filters?.hasta } }
        : {}),
    },
    include: {
      usuario: { select: { nombre: true } },
      producto: { select: { sku: true, titulo: true, deletedAt: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return items.map((item) => ({
    ...item,
    cambios:
      role === "ADMIN"
        ? item.cambios
        : Array.isArray(item.cambios)
          ? item.cambios.filter(
              (v) =>
                !v ||
                typeof v !== "object" ||
                !("campo" in v) ||
                !["costo", "monedaCosto"].includes(String(v.campo)),
            )
          : [],
  }));
}
