import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BatchPanel } from "@/components/productos/BatchPanel";
export default async function Batch() {
  await requireSession("EDITOR");
  const [categories, branches, templates] = await Promise.all([
    prisma.categoria.findMany({ where: { padreId: null }, select: { id: true, nombre: true } }),
    prisma.sucursal.findMany({ where: { activa: true }, select: { id: true, nombre: true } }),
    prisma.configuracion.findMany({ where: { clave: { startsWith: "importacion:" } } }),
  ]);
  return (
    <BatchPanel
      categories={categories}
      branches={branches}
      templates={templates.map((v) => ({
        nombre: v.clave.slice(12),
        mapeo: v.valor as Record<string, string>,
      }))}
    />
  );
}
