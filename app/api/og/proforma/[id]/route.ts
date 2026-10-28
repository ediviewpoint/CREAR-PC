import { createElement } from "react";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "@vercel/og";
import { ProformaOg } from "@/components/proforma/ProformaOg";
import { getPublicProforma } from "@/lib/proforma/load";
export const runtime = "nodejs";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getPublicProforma(id);
  if (!data) return new Response("Proforma no disponible", { status: 404 });
  const font = await readFile(path.join(process.cwd(), "public/fonts/inter-regular.woff"));
  return new ImageResponse(createElement(ProformaOg, { data }), {
    width: 1200,
    height: 630,
    fonts: [{ name: "Inter", data: new Uint8Array(font).buffer, weight: 400, style: "normal" }],
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
