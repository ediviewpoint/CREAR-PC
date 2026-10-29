import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { apiError, ApiError, readJson } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { randomUUID } from "node:crypto";
const CategorySchema = z
  .object({
    nombre: z.string().trim().min(1).max(80),
    padreId: z.string().min(1).max(100).nullable().default(null),
  })
  .strict();
export async function GET() {
  try {
    await requireSession();
    return Response.json({ items: await prisma.categoria.findMany({ orderBy: { orden: "asc" } }) });
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(request: Request) {
  try {
    const session = await requireSession("EDITOR");
    const input = CategorySchema.parse(await readJson(request));
    const category = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext('elitepc-categories'))::text`;
      if (
        input.padreId &&
        !(await tx.categoria.findFirst({ where: { id: input.padreId, padreId: null } }))
      )
        throw new ApiError("VALIDACION", "Elige una categoría principal", 422);
      if (
        await tx.categoria.findFirst({
          where: { padreId: input.padreId, nombre: { equals: input.nombre, mode: "insensitive" } },
        })
      )
        throw new ApiError("VALIDACION", "Ya existe una categoría con ese nombre", 422);
      const slug = slugify(input.nombre);
      const existing = await tx.categoria.findUnique({ where: { slug } });
      const last = await tx.categoria.aggregate({
        where: { padreId: input.padreId },
        _max: { orden: true },
      });
      const created = await tx.categoria.create({
        data: {
          ...input,
          nombre: input.nombre.toUpperCase(),
          slug: existing ? `${slug}-${randomUUID().slice(0, 8)}` : slug,
          orden: (last._max.orden ?? -1) + 1,
          specsSugeridas: [],
        },
      });
      await tx.auditoria.create({
        data: {
          usuarioId: session.user.id,
          accion: "categoria_crear",
          detalle: { id: created.id, nombre: created.nombre, padreId: created.padreId },
        },
      });
      return created;
    });
    return Response.json(category, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
export async function PATCH(request: Request) {
  try {
    const session = await requireSession("EDITOR");
    const { ids } = z
      .object({
        ids: z
          .array(z.string().min(1).max(100))
          .min(1)
          .max(1000)
          .refine((v) => new Set(v).size === v.length),
      })
      .strict()
      .parse(await readJson(request));
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext('elitepc-categories'))::text`;
      const all = await tx.categoria.findMany({ where: { padreId: null }, select: { id: true } });
      if (all.length !== ids.length || all.some((v) => !ids.includes(v.id)))
        throw new ApiError("CONFLICTO_VERSION", "Las categorías cambiaron. Recarga la página", 409);
      for (const [orden, id] of ids.entries())
        await tx.categoria.update({ where: { id }, data: { orden } });
      await tx.auditoria.create({
        data: { usuarioId: session.user.id, accion: "categorias_reordenar", detalle: { ids } },
      });
    });
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
