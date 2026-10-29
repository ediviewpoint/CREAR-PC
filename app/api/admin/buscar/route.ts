import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { apiError } from "@/lib/api-errors";
import { z } from "zod";
import { searchPriceCents } from "@/lib/productos/query";
export async function GET(request: Request) {
  try {
    await requireSession();
    const q = z
      .string()
      .trim()
      .max(160)
      .parse(new URL(request.url).searchParams.get("q") || "");
    if (!q) return Response.json({ items: [] });
    const numeric = searchPriceCents(q);
    const items = await prisma.producto.findMany({
      where: {
        deletedAt: null,
        OR: [
          { titulo: { contains: q, mode: "insensitive" } },
          { sku: { contains: q, mode: "insensitive" } },
          { modelo: { contains: q, mode: "insensitive" } },
          ...(numeric !== null && Number.isSafeInteger(numeric) && numeric <= 2147483647
            ? [{ precioSinFactura: numeric }, { precioConFactura: numeric }]
            : []),
        ],
      },
      select: {
        id: true,
        sku: true,
        titulo: true,
        imagenes: { orderBy: { orden: "asc" }, take: 1, select: { urlMiniatura: true } },
      },
      take: 8,
      orderBy: { updatedAt: "desc" },
    });
    return Response.json({
      items: items.map((item) => ({
        id: item.id,
        sku: item.sku,
        titulo: item.titulo,
        imagen: item.imagenes[0]?.urlMiniatura ?? null,
      })),
    });
  } catch (error) {
    return apiError(error);
  }
}
