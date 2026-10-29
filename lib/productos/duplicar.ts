import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { generateKeyBetween } from "fractional-indexing";
import { nextSku } from "@/lib/sku";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-errors";
import { checkWriteRate } from "./mutaciones";
import { hasRole, type UserRole } from "@/lib/auth-permissions";
export async function duplicateInTransaction(
  tx: Prisma.TransactionClient,
  id: string,
  userId: string,
) {
  const source = await tx.producto.findFirst({
    where: { id, deletedAt: null },
    include: {
      specs: true,
      imagenes: true,
      destacados: true,
      puntosClave: true,
      stocks: true,
      etiquetas: true,
      gruposOpciones: true,
    },
  });
  if (!source) throw new ApiError("NO_ENCONTRADO", "El producto no existe o fue eliminado", 404);
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext('elitepc-product-order'))::text`;
  const [last] = await tx.$queryRaw<
    { orden: string }[]
  >`SELECT orden FROM "Producto" ORDER BY orden COLLATE "C" DESC LIMIT 1`;
  const sku = await nextSku(tx);
  const {
    specs,
    imagenes,
    destacados,
    puntosClave,
    stocks,
    etiquetas,
    gruposOpciones,
    datosCompatibilidad,
    ...base
  } = source;
  // DECISION: duplicar genera un borrador y pone stock controlado en cero para no inventar existencias.
  const copy = await tx.producto.create({
    data: {
      ...base,
      id: undefined,
      sku,
      slug: `${source.slug}-${sku.toLowerCase()}`,
      titulo: `${source.titulo.slice(0, 152)} (copia)`,
      tituloManual: true,
      estado: "borrador",
      orden: generateKeyBetween(last?.orden || null, null),
      creadoPorId: userId,
      actualizadoPorId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      legacyComponentId: null,
      wpId: null,
      wpSyncEstado: null,
      wpSyncFecha: null,
      wpSyncError: null,
      requiereRevision: true,
      ...(datosCompatibilidad !== null
        ? { datosCompatibilidad: datosCompatibilidad as Prisma.InputJsonValue }
        : {}),
      disponibilidad:
        source.controlaInventario && source.disponibilidad !== "BAJO_PEDIDO"
          ? "SIN_STOCK"
          : source.disponibilidad,
      specs: {
        create: specs.map((v) => ({
          campo: v.campo,
          valor: v.valor,
          icono: v.icono,
          orden: v.orden,
          origen: v.origen,
          confianza: v.confianza,
          fuenteUrl: v.fuenteUrl,
          confirmado: v.confirmado,
        })),
      },
      imagenes: {
        create: imagenes.map((v) => ({
          url: v.url,
          urlMiniatura: v.urlMiniatura,
          alt: v.alt,
          orden: v.orden,
          ancho: v.ancho,
          alto: v.alto,
        })),
      },
      destacados: {
        create: destacados.map((v) => ({
          icono: v.icono,
          texto: v.texto,
          orden: v.orden,
          origen: v.origen,
        })),
      },
      puntosClave: {
        create: puntosClave.map((v) => ({
          titulo: v.titulo,
          descripcion: v.descripcion,
          enPdf: v.enPdf,
          orden: v.orden,
          origen: v.origen,
        })),
      },
      stocks: { create: stocks.map((v) => ({ sucursalId: v.sucursalId, cantidad: 0 })) },
      etiquetas: { create: etiquetas.map((v) => ({ etiquetaId: v.etiquetaId })) },
      gruposOpciones: {
        create: gruposOpciones.map((v) => ({
          nombre: v.nombre,
          obligatorio: v.obligatorio,
          multiple: v.multiple,
          opciones: v.opciones as Prisma.InputJsonValue,
          orden: v.orden,
        })),
      },
    },
    select: { id: true, sku: true, titulo: true },
  });
  await tx.productoHistorial.create({
    data: {
      productoId: copy.id,
      usuarioId: userId,
      accion: "crear",
      origen: "duplicar",
      cambios: [{ campo: "productoOrigen", antes: null, despues: id }],
    },
  });
  return copy;
}
export async function duplicateProduct(id: string, actor: { id: string; rol: UserRole }) {
  if (!hasRole(actor.rol, "EDITOR"))
    throw new ApiError("SIN_PERMISO", "No tienes permiso para esta acción", 403);
  return prisma.$transaction(async (tx) => {
    await checkWriteRate(tx, actor);
    return duplicateInTransaction(tx, id, actor.id);
  });
}
