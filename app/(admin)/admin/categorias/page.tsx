import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CategoriasPanel } from "@/components/productos/CategoriasPanel";
import { hasRole } from "@/lib/auth-permissions";
export default async function Categories() {
  const session = await requireSession();
  const categories = await prisma.categoria.findMany({
    orderBy: { orden: "asc" },
    include: { _count: { select: { productos: true } } },
  });
  return (
    <CategoriasPanel
      editor={hasRole(session.user.rol, "EDITOR")}
      categories={categories.map((v) => ({
        id: v.id,
        nombre: v.nombre,
        padreId: v.padreId,
        total: v._count.productos,
        plantillaTitulo: v.plantillaTitulo || "",
        specsSugeridas: Array.isArray(v.specsSugeridas)
          ? (v.specsSugeridas as { campo: string; icono?: string | null; obligatorio: boolean }[])
          : [],
      }))}
    />
  );
}
