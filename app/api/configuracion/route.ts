import { requireSession } from "@/lib/auth";
import { apiError, readJson } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { SettingsSchema } from "@/lib/admin-settings";
export async function GET() {
  try {
    await requireSession("ADMIN");
    const now = new Date(Date.now() - 4 * 3600000);
    const month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 4));
    const [settings, users, aliases, usage, created, edits] = await Promise.all([
      prisma.configuracion.findMany({
        where: { clave: { in: Object.keys(SettingsSchema.shape) } },
      }),
      prisma.usuario.findMany({
        select: { id: true, nombre: true, email: true, rol: true, activo: true },
        orderBy: { nombre: "asc" },
      }),
      prisma.alias.findMany({ orderBy: [{ tipo: "asc" }, { valor: "asc" }] }),
      prisma.usoIA.groupBy({
        by: ["usuarioId", "funcion"],
        where: { createdAt: { gte: month } },
        _sum: { costoUsd: true, tokensIn: true, tokensOut: true },
        _count: true,
      }),
      prisma.producto.groupBy({
        by: ["creadoPorId"],
        where: { createdAt: { gte: month } },
        _count: true,
      }),
      prisma.productoHistorial.groupBy({
        by: ["usuarioId"],
        where: { createdAt: { gte: month } },
        _count: true,
      }),
    ]);
    return Response.json({
      settings: Object.fromEntries(settings.map((v) => [v.clave, v.valor])),
      users,
      aliases,
      usage,
      created,
      edits,
    });
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(request: Request) {
  try {
    const session = await requireSession("ADMIN");
    const data = SettingsSchema.strict().parse(await readJson(request));
    await prisma.$transaction(async (tx) => {
      for (const [clave, valor] of Object.entries(data))
        if (valor !== undefined)
          await tx.configuracion.upsert({
            where: { clave },
            create: { clave, valor },
            update: { valor },
          });
      await tx.auditoria.create({
        data: {
          usuarioId: session.user.id,
          accion: "configuracion_editar",
          detalle: { claves: Object.keys(data) },
        },
      });
    });
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
