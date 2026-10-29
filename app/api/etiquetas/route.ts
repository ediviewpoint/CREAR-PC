import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { apiError, readJson, ApiError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
const Tag = z.object({
  id: z.string().optional(),
  nombre: z
    .string()
    .trim()
    .min(1)
    .max(60)
    .transform((v) => v.toUpperCase()),
});
export async function GET(request: Request) {
  try {
    await requireSession();
    const q = z
      .string()
      .max(100)
      .parse(new URL(request.url).searchParams.get("q") || "");
    return Response.json({
      items: await prisma.etiqueta.findMany({
        where: q ? { nombre: { contains: q, mode: "insensitive" } } : {},
        orderBy: { nombre: "asc" },
        take: 100,
        include: { _count: { select: { productos: true } } },
      }),
    });
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(request: Request) {
  try {
    const session = await requireSession("EDITOR");
    const data = Tag.parse(await readJson(request));
    const tag = await prisma.$transaction(async (tx) => {
      const item = data.id
        ? await tx.etiqueta.update({ where: { id: data.id }, data: { nombre: data.nombre } })
        : await tx.etiqueta.upsert({
            where: { nombre: data.nombre },
            create: { nombre: data.nombre },
            update: {},
          });
      await tx.auditoria.create({
        data: {
          usuarioId: session.user.id,
          accion: "etiqueta_editar",
          detalle: { id: item.id, nombre: item.nombre },
        },
      });
      return item;
    });
    return Response.json(tag);
  } catch (error) {
    return apiError(error);
  }
}
export async function DELETE(request: Request) {
  try {
    const session = await requireSession("EDITOR");
    const { id } = z.object({ id: z.string().min(1).max(100) }).parse(await readJson(request));
    if (await prisma.productoEtiqueta.count({ where: { etiquetaId: id } }))
      throw new ApiError("VALIDACION", "Quita primero la etiqueta de sus productos", 422);
    await prisma.$transaction([
      prisma.etiqueta.delete({ where: { id } }),
      prisma.auditoria.create({
        data: { usuarioId: session.user.id, accion: "etiqueta_eliminar", detalle: { id } },
      }),
    ]);
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
