import path from "node:path";
import QRCode from "qrcode";
import { renderToBuffer } from "@react-pdf/renderer";
import { ProformaPDF, registerProformaFonts } from "@/components/proforma/ProformaPDF";
import { getAccessibleProforma, proformaUrl } from "@/lib/proforma/load";
export const runtime = "nodejs";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getAccessibleProforma(id);
  if (!data) return new Response("Proforma no disponible", { status: 404 });
  registerProformaFonts(path.join(process.cwd(), "public/fonts"));
  const url = proformaUrl(id),
    qrDataUrl = await QRCode.toDataURL(url, {
      width: 256,
      margin: 4,
      color: { dark: "#13284A", light: "#FFFFFF" },
    });
  const pdf = await renderToBuffer(ProformaPDF({ data, url, qrDataUrl }));
  const inline = new URL(request.url).searchParams.get("inline") === "1";
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="CREAR-PC-${data.code}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
