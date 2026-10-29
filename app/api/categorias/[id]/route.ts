import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { apiError, ApiError, readJson } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
const Schema = z.object({ nombre: z.string().trim().min(1).max(80) }).strict();
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession("EDITOR");
    const id = z
      .string()
      .min(1)
      .max(100)
      .parse((await params).id);
    const { nombre } = Schema.parse(await readJson(request));
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
        data: { nombre: nombre.toUpperCase() },
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
