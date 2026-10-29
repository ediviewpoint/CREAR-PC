import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { apiError, ApiError, readJson } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
const Schema = z
  .object({
    nombre: z.string().trim().min(1).max(80),
    plantillaTitulo: z.string().max(500).optional(),
    specsSugeridas: z
      .array(
        z.object({
          campo: z.string().trim().min(1).max(80),
          icono: z.string().max(40).nullable().optional(),
          obligatorio: z.boolean(),
        }),
      )
      .max(100)
      .optional(),
  })
  .strict();
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession("EDITOR");
    const id = z
      .string()
      .min(1)
      .max(100)
      .parse((await params).id);
    const { nombre, ...settings } = Schema.parse(await readJson(request));
    const updated = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext('elitepc-categories'))::text`;
      const current = await tx.categoria.findUnique({ where: { id } });
      if (!current) throw new ApiError("NO_ENCONTRADO", "La categoría no existe", 404);
      if (
        await tx.categoria.findFirst({
          where: {
            id: { not: id },
            padreId: current.padreId,
            nombre: { equals: nombre, mode: "insensitive" },
          },
        })
      )
        throw new ApiError("VALIDACION", "Ya existe una categoría con ese nombre", 422);
      const item = await tx.categoria.update({
        where: { id },
        data: { nombre: nombre.toUpperCase(), ...settings },
      });
      await tx.auditoria.create({
        data: {
          usuarioId: session.user.id,
          accion: "categoria_editar",
          detalle: { id, antes: current.nombre, despues: item.nombre },
        },
      });
      return item;
    });
    return Response.json(updated);
  } catch (error) {
    return apiError(error);
  }
}
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession("EDITOR");
    const id = z
      .string()
      .min(1)
      .max(100)
      .parse((await params).id);
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext('elitepc-categories'))::text`;
      if (
        (await tx.producto.count({
          where: { OR: [{ categoriaId: id }, { subcategoriaId: id }] },
        })) ||
        (await tx.categoria.count({ where: { padreId: id } }))
      )
        throw new ApiError(
          "VALIDACION",
          "Solo puedes eliminar categorías sin productos ni subcategorías",
          422,
        );
      await tx.categoria.delete({ where: { id } });
      await tx.auditoria.create({
        data: { usuarioId: session.user.id, accion: "categoria_eliminar", detalle: { id } },
      });
    });
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
