import { requireSession } from "@/lib/auth";
import { apiError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { nextSku } from "@/lib/sku";
export async function GET() {
  try {
    await requireSession("EDITOR");
    return Response.json({ sku: await prisma.$transaction(nextSku) });
  } catch (error) {
    return apiError(error);
  }
}
