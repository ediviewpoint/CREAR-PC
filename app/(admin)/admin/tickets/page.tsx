import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasRole } from "@/lib/auth-permissions";
import { TicketsProductos } from "@/components/productos/TicketsProductos";
export default async function Tickets() {
  const session = await requireSession();
  const branches = await prisma.sucursal.findMany({
    where: { activa: true },
    select: { id: true, nombre: true },
  });
  return <TicketsProductos branches={branches} editor={hasRole(session.user.rol, "EDITOR")} />;
}
