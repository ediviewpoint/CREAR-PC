import "server-only";
import { prisma } from "@/lib/prisma";
import { getExchangeRate } from "@/lib/configuracion";
import { z } from "zod";
export async function productFormData() {
  const [categories, brands, tags, branches, settings, rate] = await Promise.all([
    prisma.categoria.findMany({ orderBy: { orden: "asc" } }),
    prisma.marca.findMany({ orderBy: { nombre: "asc" }, select: { nombre: true } }),
    prisma.etiqueta.findMany({ take: 100, orderBy: { nombre: "asc" }, select: { nombre: true } }),
    prisma.sucursal.findMany({ where: { activa: true }, select: { id: true, nombre: true } }),
    prisma.configuracion.findMany({
      where: { clave: { in: ["recargoConFactura", "redondearDecena", "umbralStockBajo"] } },
    }),
    getExchangeRate(),
  ]);
  const config = Object.fromEntries(settings.map((v) => [v.clave, v.valor]));
  return {
    categories: categories.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      padreId: c.padreId,
      plantillaTitulo: c.plantillaTitulo,
      specsSugeridas: z
        .array(z.object({ campo: z.string(), icono: z.string().nullable().optional() }))
        .catch([])
        .parse(c.specsSugeridas),
    })),
    brands: brands.map((v) => v.nombre),
    tags: tags.map((v) => v.nombre),
    branches,
    settings: {
      rate: rate.valor,
      markup: Number(config.recargoConFactura ?? 16),
      round: config.redondearDecena !== false,
      threshold: Number(config.umbralStockBajo ?? 2),
    },
  };
}
export type ProductFormData = Awaited<ReturnType<typeof productFormData>>;
