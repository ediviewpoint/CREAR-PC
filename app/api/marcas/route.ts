import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { apiError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
export async function GET(request: Request) {
  try {
    await requireSession();
    const q = z
      .string()
      .max(100)
      .parse(new URL(request.url).searchParams.get("q") || "");
    return Response.json({
      items: await prisma.marca.findMany({
        where: q ? { nombre: { contains: q, mode: "insensitive" } } : {},
        orderBy: { nombre: "asc" },
        take: 100,
      }),
    });
  } catch (error) {
    return apiError(error);
  }
}
