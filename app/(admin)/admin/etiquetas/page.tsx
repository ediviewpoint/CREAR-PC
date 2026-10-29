import { requireSession } from "@/lib/auth";
import { hasRole } from "@/lib/auth-permissions";
import { prisma } from "@/lib/prisma";
import { EtiquetasPanel } from "@/components/productos/EtiquetasPanel";
export default async function Tags() {
  const session = await requireSession();
  const items = await prisma.etiqueta.findMany({
    orderBy: { nombre: "asc" },
    include: { _count: { select: { productos: true } } },
  });
  return (
    <EtiquetasPanel
      editor={hasRole(session.user.rol, "EDITOR")}
      items={items.map((v) => ({ id: v.id, nombre: v.nombre, total: v._count.productos }))}
    />
  );
}
