import { requireSession } from "@/lib/auth";
import { apiError, readJson } from "@/lib/api-errors";
import { createBatch } from "@/lib/ia/batch";
import { prisma } from "@/lib/prisma";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const session = await requireSession("EDITOR");
    return Response.json(await createBatch(await readJson(request), session.user));
  } catch (error) {
    return apiError(error);
  }
}
export async function GET() {
  try {
    const session = await requireSession("EDITOR");
    return Response.json({
      items: await prisma.trabajoBatch.findMany({
        where: {
          ...(session.user.rol !== "ADMIN" ? { usuarioId: session.user.id } : {}),
          createdAt: { gte: new Date(Date.now() - 30 * 86400000) },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          tipoEntrada: true,
          estado: true,
          total: true,
          procesados: true,
          createdAt: true,
          costoUsd: true,
        },
      }),
    });
  } catch (error) {
    return apiError(error);
  }
}
