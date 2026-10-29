import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { ApiError } from "@/lib/api-errors";
import { hasRole, type UserRole } from "@/lib/auth-permissions";
import { checkWriteRate } from "./mutaciones";
import { duplicateInTransaction } from "./duplicar";
const ids = z
  .array(z.string().min(1).max(100))
  .min(1)
  .max(2000)
  .transform((v) => [...new Set(v)]);
export const BulkSchema = z.discriminatedUnion("accion", [
  z.object({
    ids,
    accion: z.enum([
      "disponible",
      "agotado",
      "esconder",
      "mostrar",
      "archivar",
      "eliminar",
      "duplicar",
    ]),
  }),
  z.object({
    ids,
    accion: z.literal("categoria"),
    datos: z.object({ categoriaId: z.string().min(1) }),
  }),
  z.object({
    ids,
    accion: z.enum(["agregarEtiquetas", "quitarEtiquetas"]),
    datos: z.object({ etiquetas: z.array(z.string().trim().min(1).max(60)).min(1).max(30) }),
  }),
  z.object({
    ids,
    accion: z.literal("ajustarPrecio"),
    datos: z.object({
      tipo: z.enum(["porcentaje", "monto"]),
      valor: z.number().finite().min(-2147483647).max(2147483647),
      redondear: z.boolean(),
    }),
  }),
]);
export async function bulkProducts(input: unknown, actor: { id: string; rol: UserRole }) {
  const action = BulkSchema.parse(input);
  if (!hasRole(actor.rol, "EDITOR") || (action.accion === "eliminar" && actor.rol !== "ADMIN"))
    throw new ApiError("SIN_PERMISO", "No tienes permiso para esta acción", 403);
  return prisma.$transaction(
    async (tx) => {
      await checkWriteRate(tx, actor);
      const products = await tx.producto.findMany({
        where: { id: { in: action.ids }, deletedAt: null },
        orderBy: { id: "asc" },
      });
      if (products.length !== action.ids.length)
        throw new ApiError(
          "CONFLICTO_VERSION",
          "Uno de los productos fue eliminado. Recarga el listado",
          409,
        );
      if (
        action.accion === "categoria" &&
        !(await tx.categoria.findFirst({ where: { id: action.datos.categoriaId, padreId: null } }))
      )
        throw new ApiError("VALIDACION", "Elige una categoría principal", 422);
      const tagIds: string[] = [];
      if (action.accion === "agregarEtiquetas" || action.accion === "quitarEtiquetas")
        for (const raw of action.datos.etiquetas) {
          const nombre = raw.trim().toUpperCase();
          const tag =
            action.accion === "agregarEtiquetas"
              ? await tx.etiqueta.upsert({ where: { nombre }, create: { nombre }, update: {} })
              : await tx.etiqueta.findUnique({ where: { nombre } });
          if (tag) tagIds.push(tag.id);
        }
      for (const product of products) {
        if (action.accion === "duplicar") {
          await duplicateInTransaction(tx, product.id, actor.id);
          continue;
        }
        const data: Prisma.ProductoUncheckedUpdateManyInput = { actualizadoPorId: actor.id };
        if (action.accion === "disponible") {
          if (product.controlaInventario) {
            const sum = await tx.stockSucursal.aggregate({
              where: { productoId: product.id },
              _sum: { cantidad: true },
            });
            if (!sum._sum.cantidad)
              throw new ApiError(
                "VALIDACION",
                `${product.sku}: repón stock antes de marcar disponible`,
                422,
              );
          }
          data.disponibilidad = "EN_STOCK";
          data.stockAutomatico = false;
        }
        if (action.accion === "agotado") {
          data.disponibilidad = "SIN_STOCK";
          data.stockAutomatico = false;
        }
        if (action.accion === "esconder" || action.accion === "mostrar")
          data.escondido = action.accion === "esconder";
        if (action.accion === "archivar") data.estado = "archivado";
        if (action.accion === "eliminar") data.deletedAt = new Date();
        if (action.accion === "categoria") {
          data.categoriaId = action.datos.categoriaId;
          data.subcategoriaId = null;
          data.requiereRevision = true;
        }
        if (action.accion === "ajustarPrecio") {
          for (const field of ["precioSinFactura", "precioConFactura", "precioOferta"] as const) {
            const before = product[field];
            if (before === null) continue;
            let after =
              action.datos.tipo === "monto"
                ? before + action.datos.valor
                : before * (1 + action.datos.valor / 100);
            after = action.datos.redondear ? Math.round(after / 1000) * 1000 : Math.round(after);
            if (!Number.isSafeInteger(after) || after <= 0 || after > 2147483647)
              throw new ApiError(
                "VALIDACION",
                `${product.sku}: el ajuste deja un precio inválido`,
                422,
              );
            data[field] = after;
          }
          const sf =
            typeof data.precioSinFactura === "number"
              ? data.precioSinFactura
              : product.precioSinFactura;
          const offer =
            typeof data.precioOferta === "number" ? data.precioOferta : product.precioOferta;
          if (sf && offer && offer >= sf)
            throw new ApiError(
              "VALIDACION",
              `${product.sku}: la oferta debe quedar por debajo del precio normal`,
              422,
            );
        }
        const changes: Prisma.InputJsonObject[] = Object.entries(data)
          .filter(
            ([field, value]) =>
              field !== "actualizadoPorId" && product[field as keyof typeof product] !== value,
          )
          .map(([campo, despues]) => ({
            campo,
            antes: product[campo as keyof typeof product] as Prisma.InputJsonValue,
            despues:
              despues instanceof Date ? despues.toISOString() : (despues as Prisma.InputJsonValue),
          }));
        if (action.accion === "agregarEtiquetas" || action.accion === "quitarEtiquetas") {
          const before = await tx.productoEtiqueta.findMany({
            where: { productoId: product.id },
            select: { etiquetaId: true },
          });
          if (action.accion === "agregarEtiquetas")
            await tx.productoEtiqueta.createMany({
              data: tagIds.map((etiquetaId) => ({ productoId: product.id, etiquetaId })),
              skipDuplicates: true,
            });
          else
            await tx.productoEtiqueta.deleteMany({
              where: { productoId: product.id, etiquetaId: { in: tagIds } },
            });
          changes.push({
            campo: "etiquetas",
            antes: before.map((v) => v.etiquetaId),
            despues: (
              await tx.productoEtiqueta.findMany({
                where: { productoId: product.id },
                select: { etiquetaId: true },
              })
            ).map((v) => v.etiquetaId),
          });
        }
        const updated = await tx.producto.updateMany({
          where: { id: product.id, updatedAt: product.updatedAt, deletedAt: null },
          data,
        });
        if (!updated.count)
          throw new ApiError(
            "CONFLICTO_VERSION",
            "Otra persona editó uno de los productos. Recarga el listado",
            409,
          );
        await tx.productoHistorial.create({
          data: {
            productoId: product.id,
            usuarioId: actor.id,
            accion: action.accion === "eliminar" ? "eliminar" : "editar",
            cambios: changes,
            origen: `masivo:${action.accion}`,
          },
        });
      }
      return { actualizados: products.length };
    },
    { timeout: 60000 },
  );
}
