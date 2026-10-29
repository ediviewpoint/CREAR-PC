import "server-only";
import { z } from "zod";
import { generateKeyBetween } from "fractional-indexing";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { ApiError } from "@/lib/api-errors";
import { hasRole, type UserRole } from "@/lib/auth-permissions";
const amount = z.number().int().positive().max(2147483647).nullable();
export const QuickPatchSchema = z
  .object({
    updatedAt: z.iso.datetime(),
    precioSinFactura: amount.optional(),
    precioConFactura: amount.optional(),
    disponibilidad: z.enum(["EN_STOCK", "SIN_STOCK", "BAJO_PEDIDO"]).optional(),
    escondido: z.boolean().optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 1, "No hay cambios");
export const ReorderSchema = z
  .object({
    id: z.string().min(1).max(100),
    antesDe: z.string().min(1).max(100).nullable().optional(),
    despuesDe: z.string().min(1).max(100).nullable().optional(),
  })
  .strict()
  .refine((v) => !!v.antesDe || !!v.despuesDe, "Selecciona los vecinos del producto");
type Actor = { id: string; rol: UserRole };
export async function checkWriteRate(tx: Prisma.TransactionClient, actor: Actor) {
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`product-write:${actor.id}`}))::text`;
  const count = await tx.auditoria.count({
    where: {
      usuarioId: actor.id,
      accion: "producto_escritura",
      createdAt: { gte: new Date(Date.now() - 60000) },
    },
  });
  if (count >= 60)
    throw new ApiError("LIMITE_ESCRITURAS", "Espera un minuto antes de volver a guardar", 429);
  // DECISION: el límite cuenta solicitudes de escritura; un lote cuenta una solicitud y mantiene historial por producto.
  await tx.auditoria.create({
    data: { usuarioId: actor.id, accion: "producto_escritura", detalle: {} },
  });
}
function forbidden() {
  throw new ApiError("SIN_PERMISO", "No tienes permiso para esta acción", 403);
}
export async function quickPatch(id: string, input: unknown, actor: Actor) {
  const { updatedAt, ...data } = QuickPatchSchema.parse(input);
  if (
    !hasRole(actor.rol, "EDITOR") &&
    (actor.rol !== "VENDEDOR" || Object.keys(data).some((key) => key !== "disponibilidad"))
  )
    forbidden();
  return prisma.$transaction(async (tx) => {
    await checkWriteRate(tx, actor);
    const current = await tx.producto.findFirst({ where: { id, deletedAt: null } });
    if (!current) throw new ApiError("NO_ENCONTRADO", "El producto no existe o fue eliminado", 404);
    const sf =
      data.precioSinFactura === undefined ? current.precioSinFactura : data.precioSinFactura;
    const cf =
      data.precioConFactura === undefined ? current.precioConFactura : data.precioConFactura;
    if (current.tipo === "CARRITO" && current.estado !== "borrador" && !sf && !cf)
      throw new ApiError("VALIDACION", "Ingresa al menos un precio", 422, {
        precioSinFactura: "Ingresa al menos un precio",
      });
    if (sf && cf && cf < sf)
      throw new ApiError(
        "VALIDACION",
        "El precio con factura no puede ser menor que sin factura",
        422,
        { precioConFactura: "El precio con factura no puede ser menor que sin factura" },
      );
    if (current.precioOferta && sf && current.precioOferta >= sf)
      throw new ApiError("VALIDACION", "La oferta debe ser menor al precio normal", 422);
    if (data.disponibilidad === "EN_STOCK" && current.controlaInventario) {
      const sum = await tx.stockSucursal.aggregate({
        where: { productoId: id },
        _sum: { cantidad: true },
      });
      if (!sum._sum.cantidad)
        throw new ApiError(
          "VALIDACION",
          "Repón stock en una sucursal antes de marcar disponible",
          422,
        );
    }
    const version = new Date(updatedAt);
    const result = await tx.producto.updateMany({
      where: { id, deletedAt: null, updatedAt: version },
      data: {
        ...data,
        ...(data.disponibilidad ? { stockAutomatico: false } : {}),
        actualizadoPorId: actor.id,
      },
    });
    if (!result.count)
      throw new ApiError(
        "CONFLICTO_VERSION",
        "Otra persona editó este producto. Ver cambios",
        409,
        undefined,
        { updatedAt: current.updatedAt.toISOString() },
      );
    const changes = Object.entries(data)
      .filter(([key, value]) => current[key as keyof typeof current] !== value)
      .map(([campo, despues]) => ({
        campo,
        antes: current[campo as keyof typeof current] as Prisma.InputJsonValue,
        despues,
      }));
    await tx.productoHistorial.create({
      data: {
        productoId: id,
        usuarioId: actor.id,
        accion:
          "precioSinFactura" in data || "precioConFactura" in data ? "precio_rapido" : "editar",
        cambios: changes,
        origen: "listado",
      },
    });
    return {
      id,
      updatedAt: (
        await tx.producto.findUniqueOrThrow({ where: { id }, select: { updatedAt: true } })
      ).updatedAt,
    };
  });
}
export async function softDelete(id: string, actor: Actor) {
  if (actor.rol !== "ADMIN") forbidden();
  return prisma.$transaction(async (tx) => {
    await checkWriteRate(tx, actor);
    const result = await tx.producto.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date(), actualizadoPorId: actor.id },
    });
    if (!result.count)
      throw new ApiError("NO_ENCONTRADO", "El producto no existe o fue eliminado", 404);
    await tx.productoHistorial.create({
      data: {
        productoId: id,
        usuarioId: actor.id,
        accion: "eliminar",
        cambios: [{ campo: "deletedAt", antes: null, despues: new Date().toISOString() }],
      },
    });
    return { id };
  });
}
export async function reorderProduct(input: unknown, actor: Actor) {
  if (!hasRole(actor.rol, "EDITOR")) forbidden();
  const data = ReorderSchema.parse(input);
  if (
    data.id === data.antesDe ||
    data.id === data.despuesDe ||
    (data.antesDe && data.antesDe === data.despuesDe)
  )
    throw new ApiError("VALIDACION", "Vecinos inválidos", 422);
  return prisma.$transaction(async (tx) => {
    await checkWriteRate(tx, actor);
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext('elitepc-product-order'))::text`;
    const current = await tx.producto.findFirst({
      where: { id: data.id, deletedAt: null },
      select: { orden: true },
    });
    if (!current) throw new ApiError("NO_ENCONTRADO", "El producto no existe o fue eliminado", 404);
    const before = data.antesDe
      ? await tx.producto.findFirst({
          where: { id: data.antesDe, deletedAt: null },
          select: { orden: true },
        })
      : null;
    const after = data.despuesDe
      ? await tx.producto.findFirst({
          where: { id: data.despuesDe, deletedAt: null },
          select: { orden: true },
        })
      : null;
    if ((data.antesDe && !before) || (data.despuesDe && !after))
      throw new ApiError("CONFLICTO_VERSION", "El orden cambió. Recarga el listado", 409);
    if (before && after && after.orden >= before.orden)
      throw new ApiError("CONFLICTO_VERSION", "El orden cambió. Recarga el listado", 409);
    // DECISION: claves fraccionales mantenidas por la librería; comparación binaria COLLATE C en el listado.
    // Los filtros pueden ocultar filas intermedias: usa el vecino real para no repetir una clave.
    let lower = after?.orden ?? null;
    let upper = before?.orden ?? null;
    if (before) {
      const [neighbor] = await tx.$queryRaw<
        { orden: string }[]
      >`SELECT orden FROM "Producto" WHERE id<>${data.id} AND orden COLLATE "C" < ${before.orden} COLLATE "C" ORDER BY orden COLLATE "C" DESC LIMIT 1`;
      lower = neighbor?.orden ?? null;
    } else if (after) {
      const [neighbor] = await tx.$queryRaw<
        { orden: string }[]
      >`SELECT orden FROM "Producto" WHERE id<>${data.id} AND orden COLLATE "C" > ${after.orden} COLLATE "C" ORDER BY orden COLLATE "C" ASC LIMIT 1`;
      upper = neighbor?.orden ?? null;
    }
    const orden = generateKeyBetween(lower, upper);
    await tx.producto.update({
      where: { id: data.id },
      data: { orden, actualizadoPorId: actor.id },
    });
    await tx.productoHistorial.create({
      data: {
        productoId: data.id,
        usuarioId: actor.id,
        accion: "editar",
        cambios: [{ campo: "orden", antes: current.orden, despues: orden }],
        origen: "reordenar",
      },
    });
    return { id: data.id, orden };
  });
}
