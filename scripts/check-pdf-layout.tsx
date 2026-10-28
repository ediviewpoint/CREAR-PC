import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { createCanvas, DOMMatrix, ImageData, Path2D } from "@napi-rs/canvas";
import { ProformaPDF, registerProformaFonts } from "../components/proforma/ProformaPDF";
import { exampleProforma } from "../lib/proforma/example";
async function main() {
  Object.assign(globalThis, { DOMMatrix, ImageData, Path2D });
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  registerProformaFonts(path.resolve("public/fonts"));
  const url = "http://localhost:3000/proforma/ejemplo",
    qrDataUrl = await QRCode.toDataURL(url);
  const items = Array.from({ length: 8 }, (_, i) => ({
    ...exampleProforma.items[i % 3]!,
    name: `Componente de prueba ${i + 1}`,
  }));
  const data = { ...exampleProforma, example: false, items };
  const buffer = await renderToBuffer(ProformaPDF({ data, qrDataUrl, url }));
  const doc = await getDocument({ data: new Uint8Array(buffer) }).promise;
  assert.equal(doc.numPages, 1, "Un build habitual de 8 filas debe caber en una hoja Carta");
  const page = await doc.getPage(1),
    viewport = page.getViewport({ scale: 1.5 }),
    canvas = createCanvas(viewport.width, viewport.height);
  await page.render({
    canvas: canvas as unknown as HTMLCanvasElement,
    canvasContext: canvas.getContext("2d") as unknown as CanvasRenderingContext2D,
    viewport,
  }).promise;
  await fs.writeFile("output/qa/proforma-eight-rows.png", canvas.toBuffer("image/png"));
  const content = (await page.getTextContent()).items
    .map((x) => ("str" in x ? x.str : ""))
    .join(" ");
  assert(content.includes("Cotización no fiscal"));
  assert(content.includes("Consultá"));
  console.log("PDF: ocho filas, Carta de una página, QR, pie visibles.");
}
export const done = main();