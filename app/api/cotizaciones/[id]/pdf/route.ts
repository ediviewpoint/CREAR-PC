import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { apiError, ApiError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { productPdf } from "@/lib/productos/pdf";
import type { QuoteItem } from "@/lib/cotizaciones";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession("VENDEDOR");
    const id = z
      .string()
      .min(1)
      .max(100)
      .parse((await params).id);
    const quote = await prisma.cotizacion.findFirst({
      where: { id, ...(session.user.rol === "ADMIN" ? {} : { usuarioId: session.user.id }) },
    });
    if (!quote) throw new ApiError("NO_ENCONTRADO", "La cotización no existe", 404);
    const buffer = await productPdf(
      (quote.snapshot as unknown as { items: QuoteItem[] }).items,
      quote.codigo || "Cotización en preparación",
      quote.cliente,
    );
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${quote.codigo || "cotizacion"}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
