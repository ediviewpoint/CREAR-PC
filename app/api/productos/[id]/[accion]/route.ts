import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { apiError, ApiError } from "@/lib/api-errors";
import { getProduct } from "@/lib/productos/guardar";
import { productPdf } from "@/lib/productos/pdf";
import { whatsappText } from "@/lib/productos/whatsapp";
import { publishWp } from "@/lib/wordpress";
import { quoteAction } from "@/lib/cotizaciones";
export const maxDuration = 60;
type Context = { params: Promise<{ id: string; accion: string }> };
export async function GET(_request: Request, { params }: Context) {
  try {
    const session = await requireSession("VENDEDOR");
    const { id, accion } = z
      .object({ id: z.string().min(1).max(100), accion: z.enum(["pdf", "whatsapp"]) })
      .parse(await params);
    if (accion === "whatsapp") return Response.json({ texto: await whatsappText(id) });
    const product = await getProduct(id, session.user.rol);
    const buffer = await productPdf([{ productoId: id, cantidad: 1, producto: product }]);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${product.sku}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(_request: Request, { params }: Context) {
  try {
    const { id, accion } = z
      .object({ id: z.string().min(1).max(100), accion: z.enum(["wordpress", "cotizacion"]) })
      .parse(await params);
    const session = await requireSession(accion === "wordpress" ? "EDITOR" : "VENDEDOR");
    if (accion === "wordpress") return Response.json(await publishWp(id, session.user));
    if (accion === "cotizacion")
      return Response.json(await quoteAction({ accion: "agregar", ids: [id] }, session.user));
    throw new ApiError("NO_ENCONTRADO", "Acción no encontrada", 404);
  } catch (error) {
    return apiError(error);
  }
}
