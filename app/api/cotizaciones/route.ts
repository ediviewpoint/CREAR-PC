import { requireSession } from "@/lib/auth";
import { apiError, readJson } from "@/lib/api-errors";
import { quoteAction } from "@/lib/cotizaciones";
import { prisma } from "@/lib/prisma";
export async function GET() {
  try {
    const session = await requireSession("VENDEDOR");
    const quotes = await prisma.cotizacion.findMany({
      where: { usuarioId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return Response.json({
      abierta: quotes.find((v) => v.estado === "abierta") || null,
      historial: quotes.filter((v) => v.estado !== "abierta"),
    });
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(request: Request) {
  try {
    const session = await requireSession("VENDEDOR");
    return Response.json(await quoteAction(await readJson(request), session.user));
  } catch (error) {
    return apiError(error);
  }
}
