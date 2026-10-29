import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { ProductQuerySchema, searchPriceCents } from "./query";
export async function listProducts(input: unknown) {
  const query = ProductQuerySchema.parse(input);
  const setting = (await prisma.configuracion.findUnique({ where: { clave: "tipoCambio" } }))
    ?.valor;
  const configured =
    setting && typeof setting === "object" && !Array.isArray(setting) ? Number(setting.valor) : NaN;
  const exchange =
    Number.isFinite(configured) && configured > 0 && configured <= 10000 ? configured : 6.96;
  const clauses: Prisma.Sql[] = [
    Prisma.sql`p."deletedAt" IS NULL`,
    Prisma.sql`p.estado <> 'archivado'`,
  ];
  if (query.q) {
    const term = `%${query.q.replace(/[\\%_]/g, "\\$&")}%`;
    const cents = searchPriceCents(query.q);
    clauses.push(
      Prisma.sql`(p.titulo ILIKE ${term} OR p.sku ILIKE ${term} OR p.modelo ILIKE ${term} OR m.nombre ILIKE ${term} OR c.nombre ILIKE ${term} OR EXISTS(SELECT 1 FROM "ProductoEtiqueta" pe JOIN "Etiqueta" e ON e.id=pe."etiquetaId" WHERE pe."productoId"=p.id AND e.nombre ILIKE ${term}) ${cents === null ? Prisma.empty : Prisma.sql`OR p."precioSinFactura"=${cents} OR p."precioConFactura"=${cents}`})`,
    );
  }
  if (query.categoria) clauses.push(Prisma.sql`p."categoriaId"=${query.categoria}`);
  if (query.subcategoria) clauses.push(Prisma.sql`p."subcategoriaId"=${query.subcategoria}`);
  if (query.marca) clauses.push(Prisma.sql`p."marcaId"=${query.marca}`);
  if (query.etiqueta)
    clauses.push(
      Prisma.sql`EXISTS(SELECT 1 FROM "ProductoEtiqueta" pe WHERE pe."productoId"=p.id AND pe."etiquetaId"=${query.etiqueta})`,
    );
  if (query.tipo) clauses.push(Prisma.sql`p.tipo::text=${query.tipo}`);
  for (const [key, column] of [
    ["escondido", "escondido"],
    ["revision", "requiereRevision"],
  ] as const)
    if (query[key])
      clauses.push(Prisma.sql`${Prisma.raw(`p."${column}"`)}=${query[key] === "true"}`);
  if (query.sinImagen === "true")
    clauses.push(
      Prisma.sql`NOT EXISTS(SELECT 1 FROM "ProductoImagen" i WHERE i."productoId"=p.id)`,
    );
  if (query.precioMin)
    clauses.push(
      Prisma.sql`COALESCE(p."precioSinFactura",p."precioConFactura")>=${searchPriceCents(query.precioMin)}`,
    );
  if (query.precioMax)
    clauses.push(
      Prisma.sql`COALESCE(p."precioSinFactura",p."precioConFactura")<=${searchPriceCents(query.precioMax)}`,
    );
  const stock = Prisma.sql`CASE WHEN p."controlaInventario"=false THEN 99999 ELSE COALESCE((SELECT SUM(s.cantidad) FROM "StockSucursal" s WHERE s."productoId"=p.id ${query.sucursal === "todas" ? Prisma.empty : Prisma.sql`AND s."sucursalId"=${query.sucursal}`}),0) END`;
  const threshold = Prisma.sql`COALESCE(p."umbralStockBajo",(SELECT (valor::text)::int FROM "Configuracion" WHERE clave='umbralStockBajo'),2)`;
  if (query.disponibilidad === "STOCK_BAJO")
    clauses.push(
      Prisma.sql`p."controlaInventario"=true AND p.tipo='CARRITO' AND p.disponibilidad='EN_STOCK' AND ${stock} BETWEEN 1 AND ${threshold}`,
    );
  else if (query.disponibilidad)
    clauses.push(Prisma.sql`p.disponibilidad::text=${query.disponibilidad}`);
  const where = Prisma.sql`FROM "Producto" p JOIN "Categoria" c ON c.id=p."categoriaId" LEFT JOIN "Marca" m ON m.id=p."marcaId" LEFT JOIN "Categoria" sc ON sc.id=p."subcategoriaId" WHERE ${Prisma.join(clauses, " AND ")}`;
  const orders: Record<string, Prisma.Sql> = {
    manual: Prisma.sql`p.orden COLLATE "C"`,
    titulo: Prisma.sql`p.titulo`,
    categoria: Prisma.sql`c.nombre`,
    subcategoria: Prisma.sql`sc.nombre`,
    precioSinFactura: Prisma.sql`p."precioSinFactura"`,
    precioConFactura: Prisma.sql`p."precioConFactura"`,
    precioUsd: Prisma.sql`COALESCE(p."precioUsd",ROUND(COALESCE(p."precioSinFactura",p."precioConFactura")/COALESCE(NULLIF(p."tipoCambioUsado",0),${exchange})))`,
    tipo: Prisma.sql`p.tipo`,
    disponibilidad: Prisma.sql`p.disponibilidad`,
    createdAt: Prisma.sql`p."createdAt"`,
  };
  const [counts, rows] = await Promise.all([
    prisma.$queryRaw<{ total: bigint }[]>(Prisma.sql`SELECT COUNT(*) AS total ${where}`),
    prisma.$queryRaw<{ id: string; stockTotal: bigint; umbral: number }[]>(
      Prisma.sql`SELECT p.id,${stock} AS "stockTotal",${threshold} AS umbral ${where} ORDER BY ${orders[query.orden]} ${Prisma.raw(query.dir.toUpperCase())} NULLS LAST,p."createdAt" DESC,p.id LIMIT ${query.pageSize} OFFSET ${(query.page - 1) * query.pageSize}`,
    ),
  ]);
  const products = await prisma.producto.findMany({
    where: { id: { in: rows.map((row) => row.id) } },
    select: {
      id: true,
      sku: true,
      titulo: true,
      modelo: true,
      tipo: true,
      estado: true,
      categoriaId: true,
      subcategoriaId: true,
      marcaId: true,
      categoria: { select: { nombre: true, specsSugeridas: true } },
      subcategoria: { select: { nombre: true } },
      marca: { select: { nombre: true } },
      etiquetas: { select: { etiqueta: { select: { id: true, nombre: true } } } },
      precioSinFactura: true,
      precioConFactura: true,
      precioUsd: true,
      tipoCambioUsado: true,
      precioOferta: true,
      ofertaDesde: true,
      ofertaHasta: true,
      disponibilidad: true,
      controlaInventario: true,
      escondido: true,
      requiereRevision: true,
      destacado: true,
      updatedAt: true,
      orden: true,
      imagenes: { orderBy: { orden: "asc" }, take: 1, select: { urlMiniatura: true, alt: true } },
      specs: { select: { campo: true, valor: true } },
    },
  });
  const byId = new Map(products.map((product) => [product.id, product]));
  const now = new Date();
  const items = rows.map((row) => {
    const product = byId.get(row.id)!;
    const { categoria, subcategoria, marca, etiquetas, imagenes, specs, ...rest } = product;
    const required = Array.isArray(categoria.specsSugeridas)
      ? categoria.specsSugeridas.filter(
          (v): v is { campo: string; obligatorio: true } =>
            !!v &&
            typeof v === "object" &&
            "campo" in v &&
            typeof v.campo === "string" &&
            "obligatorio" in v &&
            v.obligatorio === true,
        )
      : [];
    const complete =
      required.length > 0 &&
      required.every((v) =>
        specs.some(
          (spec) => spec.campo.toLowerCase() === v.campo.toLowerCase() && spec.valor.trim(),
        ),
      );
    const offer =
      product.precioOferta &&
      (!product.ofertaDesde || product.ofertaDesde <= now) &&
      (!product.ofertaHasta || product.ofertaHasta >= now)
        ? product.precioOferta
        : null;
    return {
      ...rest,
      tipoCambioUsado: product.tipoCambioUsado?.toString() || String(exchange),
      precioUsd:
        product.precioUsd ??
        ((product.precioSinFactura ?? product.precioConFactura) !== null
          ? Math.round(
              (product.precioSinFactura ?? product.precioConFactura)! /
                (Number(product.tipoCambioUsado) || exchange),
            )
          : null),
      usdCalculado: product.precioUsd === null,
      precioOferta: offer,
      categoria: categoria.nombre,
      subcategoria: subcategoria?.nombre || null,
      marca: marca?.nombre || null,
      etiquetas: etiquetas.map((v) => v.etiqueta),
      imagen: imagenes[0] ? { miniatura: imagenes[0].urlMiniatura, alt: imagenes[0].alt } : null,
      stockTotal: Number(row.stockTotal),
      stockBajo:
        product.controlaInventario &&
        Number(row.stockTotal) > 0 &&
        Number(row.stockTotal) <= row.umbral &&
        product.disponibilidad === "EN_STOCK",
      iconos: [
        complete && "completo",
        ["NOTEBOOK", "GAMER"].includes(categoria.nombre) && "computo",
        (offer || product.destacado) && "oferta",
        product.requiereRevision && "revision",
        product.escondido && "escondido",
      ].filter(Boolean) as string[],
    };
  });
  return {
    items,
    total: Number(counts[0]?.total || 0),
    page: query.page,
    pageSize: query.pageSize,
  };
}
export type ProductListResult = Awaited<ReturnType<typeof listProducts>>;
export type ProductListItem = ProductListResult["items"][number];
