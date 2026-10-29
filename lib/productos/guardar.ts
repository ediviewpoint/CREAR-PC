import "server-only";
import sanitizeHtml from "sanitize-html";
import { generateKeyBetween } from "fractional-indexing";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { ProductSchema } from "./schema";
import { checkWriteRate } from "./mutaciones";
import { slugify } from "@/lib/slug";
import { ApiError } from "@/lib/api-errors";
import { hasRole, type UserRole } from "@/lib/auth-permissions";
const relations = {
  marca: true,
  categoria: true,
  subcategoria: true,
  specs: { orderBy: { orden: "asc" as const } },
  imagenes: { orderBy: { orden: "asc" as const } },
  destacados: { orderBy: { orden: "asc" as const } },
  puntosClave: { orderBy: { orden: "asc" as const } },
  stocks: true,
  etiquetas: { include: { etiqueta: true } },
  gruposOpciones: { orderBy: { orden: "asc" as const } },
};
type Complete = Prisma.ProductoGetPayload<{ include: typeof relations }>;
const children = <T extends { id: string; productoId: string; orden: number }>(rows: T[]) =>
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Se omiten identificadores internos en el DTO.
  rows.map(({ id: _id, productoId: _product, orden: _order, ...rest }) => rest);
export function productDto(p: Complete, role: UserRole) {
  const {
    marca,
    categoria,
    subcategoria,
    etiquetas,
    tipoCambioUsado,
    costo,
    monedaCosto,
    ...rest
  } = p;
  return {
    ...rest,
    specs: children(p.specs),
    imagenes: children(p.imagenes),
    destacados: children(p.destacados),
    puntosClave: children(p.puntosClave),
    gruposOpciones: children(p.gruposOpciones),
    stocks: p.stocks.map((v) => ({ sucursalId: v.sucursalId, cantidad: v.cantidad })),
    modelo: p.modelo || "",
    partNumber: p.partNumber || "",
    color: p.color || "",
    garantia: p.garantia || "",
    descripcion: p.descripcion || "",
    etiquetaDescuento: p.etiquetaDescuento || "",
    marca: marca?.nombre || "",
    categoriaNombre: categoria.nombre,
    subcategoriaNombre: subcategoria?.nombre || null,
    etiquetas: etiquetas.map((v) => v.etiqueta.nombre),
    tipoCambioUsado: tipoCambioUsado ? Number(tipoCambioUsado) : null,
    ...(role === "ADMIN" ? { costo, monedaCosto } : {}),
    updatedAt: p.updatedAt.toISOString(),
    ofertaDesde: p.ofertaDesde?.toISOString() || null,
    ofertaHasta: p.ofertaHasta?.toISOString() || null,
  };
}
export async function getProduct(id: string, role: UserRole) {
  const product = await prisma.producto.findFirst({
    where: { id, deletedAt: null },
    include: relations,
  });
  if (!product) throw new ApiError("NO_ENCONTRADO", "El producto no existe o fue eliminado", 404);
  return productDto(product, role);
}
export function cleanDescription(html: string) {
  return sanitizeHtml(html, {
    allowedTags: ["p", "strong", "em", "ul", "ol", "li", "a", "br"],
    allowedAttributes: { a: ["href", "rel"] },
    allowedSchemes: ["https", "http"],
    transformTags: { a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }) },
  });
}
export async function saveProduct(
  raw: unknown,
  actor: { id: string; rol: UserRole },
  id?: string,
  origin = "manual",
  batchId?: string,
) {
  if (!hasRole(actor.rol, "EDITOR"))
    throw new ApiError("SIN_PERMISO", "No tienes permiso para esta acción", 403);
  if (
    actor.rol !== "ADMIN" &&
    raw &&
    typeof raw === "object" &&
    ("costo" in raw || "monedaCosto" in raw)
  )
    throw new ApiError("SIN_PERMISO", "Solo un administrador puede modificar el costo", 403);
  const data = ProductSchema.parse(raw);
  return prisma.$transaction(
    async (tx) => {
      await checkWriteRate(tx, actor);
      const current = id
        ? await tx.producto.findFirst({ where: { id, deletedAt: null }, include: relations })
        : null;
      if (id && !current)
        throw new ApiError("NO_ENCONTRADO", "El producto no existe o fue eliminado", 404);
      if (current && (!data.updatedAt || current.updatedAt.toISOString() !== data.updatedAt))
        throw new ApiError(
          "CONFLICTO_VERSION",
          "Otra persona editó este producto. Ver cambios",
          409,
          undefined,
          { producto: productDto(current, actor.rol) },
        );
      let category = data.categoriaId
        ? await tx.categoria.findFirst({ where: { id: data.categoriaId, padreId: null } })
        : null;
      if (!category && data.estado === "borrador")
        category = await tx.categoria.upsert({
          where: { slug: "sin-clasificar" },
          create: {
            nombre: "SIN CLASIFICAR",
            slug: "sin-clasificar",
            orden: 999,
            specsSugeridas: [],
          },
          update: {},
        });
      if (!category)
        throw new ApiError("VALIDACION", "Elige una categoría", 422, {
          categoriaId: "Elige una categoría",
        });
      ProductSchema.parse({ ...data, categoriaId: category.id, categoriaNombre: category.nombre });
      if (
        data.subcategoriaId &&
        !(await tx.categoria.findFirst({
          where: { id: data.subcategoriaId, padreId: category.id },
        }))
      )
        throw new ApiError("VALIDACION", "La subcategoría no pertenece a la categoría", 422);
      const branchIds = data.stocks.map((v) => v.sucursalId);
      if (
        branchIds.length &&
        (await tx.sucursal.count({ where: { id: { in: branchIds }, activa: true } })) !==
          branchIds.length
      )
        throw new ApiError("VALIDACION", "Sucursal inválida", 422);
      const brandName = data.marca.trim();
      let brandId: string | null = null;
      if (brandName) {
        const alias = await tx.alias.findFirst({
          where: { tipo: "marca", valor: { equals: brandName, mode: "insensitive" } },
        });
        const existing = await tx.marca.findFirst({
          where: { nombre: { equals: alias?.normalizado || brandName, mode: "insensitive" } },
        });
        brandId = (
          existing || (await tx.marca.create({ data: { nombre: alias?.normalizado || brandName } }))
        ).id;
      }
      const total = data.stocks.reduce((sum, v) => sum + v.cantidad, 0);
      let availability = data.disponibilidad;
      let automatic = current?.stockAutomatico || false;
      if (data.controlaInventario && availability !== "BAJO_PEDIDO") {
        if (total === 0) {
          availability = "SIN_STOCK";
          automatic = current?.disponibilidad === "EN_STOCK" || !current || automatic;
        } else if (automatic) {
          availability = "EN_STOCK";
          automatic = false;
        }
      }
      const fields: Prisma.ProductoUncheckedUpdateInput = {
        sku: data.sku,
        titulo: data.titulo,
        tituloManual: data.tituloManual,
        marcaId: brandId,
        modelo: data.modelo || null,
        partNumber: data.partNumber || null,
        categoriaId: category.id,
        subcategoriaId: data.subcategoriaId,
        tipo: data.tipo,
        condicion: data.condicion,
        color: data.color || null,
        garantia: data.garantia || null,
        proveedorId: data.proveedorId,
        descripcion: cleanDescription(data.descripcion),
        precioSinFactura: data.precioSinFactura,
        precioConFactura: data.precioConFactura,
        precioOferta: data.precioOferta,
        precioUsd: data.precioUsd,
        precioMayorista: data.precioMayorista,
        tipoCambioUsado: data.tipoCambioUsado,
        ofertaDesde: data.ofertaDesde ? new Date(data.ofertaDesde) : null,
        ofertaHasta: data.ofertaHasta ? new Date(data.ofertaHasta) : null,
        etiquetaDescuento: data.etiquetaDescuento,
        disponibilidad: availability,
        controlaInventario: data.controlaInventario,
        umbralStockBajo: data.umbralStockBajo,
        stockAutomatico: automatic,
        escondido: data.escondido,
        destacado: data.destacado,
        requiereRevision:
          data.requiereRevision || data.specs.some((v) => v.confianza === "BAJA" && !v.confirmado),
        estado: data.estado,
        textoFuente: data.textoFuente,
        actualizadoPorId: actor.id,
        ...(actor.rol === "ADMIN"
          ? { costo: data.costo ?? null, monedaCosto: data.monedaCosto ?? null }
          : {}),
      };
      let slug = slugify(data.slug || data.titulo);
      const collision = await tx.producto.findFirst({
        where: { slug, ...(id ? { id: { not: id } } : {}) },
        select: { id: true },
      });
      if (collision) slug = `${slug.slice(0, 110)}-${data.sku.toLowerCase()}`;
      fields.slug = slug;
      let productId = id;
      if (!productId) {
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext('elitepc-product-order'))::text`;
        const [last] = await tx.$queryRaw<
          { orden: string }[]
        >`SELECT orden FROM "Producto" ORDER BY orden COLLATE "C" DESC LIMIT 1`;
        const created = await tx.producto.create({
          data: {
            ...fields,
            creadoPorId: actor.id,
            orden: generateKeyBetween(last?.orden || null, null),
          } as Prisma.ProductoUncheckedCreateInput,
        });
        productId = created.id;
      } else {
        const changed = await tx.producto.updateMany({
          where: { id: productId, updatedAt: current!.updatedAt },
          data: fields,
        });
        if (!changed.count)
          throw new ApiError(
            "CONFLICTO_VERSION",
            "Otra persona editó este producto. Ver cambios",
            409,
          );
      }
      // DECISION: reemplazo de hijos y auditoría dentro de la misma transacción; no existen guardados parciales.
      await tx.productoSpec.deleteMany({ where: { productoId: productId } });
      await tx.productoImagen.deleteMany({ where: { productoId: productId } });
      await tx.productoDestacado.deleteMany({ where: { productoId: productId } });
      await tx.productoPuntoClave.deleteMany({ where: { productoId: productId } });
      await tx.stockSucursal.deleteMany({ where: { productoId: productId } });
      await tx.productoEtiqueta.deleteMany({ where: { productoId: productId } });
      await tx.grupoOpciones.deleteMany({ where: { productoId: productId } });
      const ordered = <T extends object>(values: T[]) =>
        values.map((value, orden) => ({ ...value, orden, productoId: productId! }));
      if (data.specs.length)
        await tx.productoSpec.createMany({
          data: ordered(data.specs.filter((v) => v.valor.trim())),
        });
      if (data.imagenes.length)
        await tx.productoImagen.createMany({ data: ordered(data.imagenes) });
      if (data.destacados.length)
        await tx.productoDestacado.createMany({
          data: ordered(data.destacados.filter((v) => v.texto.trim())),
        });
      if (data.puntosClave.length)
        await tx.productoPuntoClave.createMany({
          data: ordered(data.puntosClave.filter((v) => v.descripcion.trim())),
        });
      if (data.stocks.length)
        await tx.stockSucursal.createMany({
          data: data.stocks.map((value) => ({ ...value, productoId: productId! })),
        });
      if (data.gruposOpciones.length)
        await tx.grupoOpciones.createMany({ data: ordered(data.gruposOpciones) });
      for (const nombre of [...new Set(data.etiquetas.map((v) => v.trim().toUpperCase()))]) {
        const tag = await tx.etiqueta.upsert({ where: { nombre }, create: { nombre }, update: {} });
        await tx.productoEtiqueta.create({ data: { productoId: productId, etiquetaId: tag.id } });
      }
      const saved = await tx.producto.findUniqueOrThrow({
        where: { id: productId },
        include: relations,
      });
      const after = productDto(saved, "ADMIN");
      const before = current ? productDto(current, "ADMIN") : null;
      const omit = new Set([
        "id",
        "createdAt",
        "updatedAt",
        "actualizadoPorId",
        "orden",
        "wpSyncFecha",
      ]);
      const changes = Object.entries(after)
        .filter(
          ([key, value]) =>
            !omit.has(key) &&
            JSON.stringify(before?.[key as keyof typeof before] ?? null) !== JSON.stringify(value),
        )
        .map(([campo, despues]) => ({
          campo,
          antes: before?.[campo as keyof typeof before] ?? null,
          despues,
        }));
      await tx.productoHistorial.create({
        data: {
          productoId: productId,
          usuarioId: actor.id,
          accion: id ? "editar" : origin === "batch" ? "batch" : "crear",
          origen: batchId ? `${origin}:${batchId}` : origin,
          cambios: JSON.parse(JSON.stringify(changes)),
        },
      });
      return productDto(saved, actor.rol);
    },
    { timeout: 30000 },
  );
}
