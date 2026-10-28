import fs from "node:fs/promises";
import assert from "node:assert/strict";
import { createCanvas, DOMMatrix, ImageData, Path2D } from "@napi-rs/canvas";
Object.assign(globalThis, { DOMMatrix, ImageData, Path2D });
const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
const data = new Uint8Array(await fs.readFile("output/pdf/crear-pc-ejemplo.pdf"));
const pdf = await getDocument({ data, useSystemFonts: true }).promise;
assert.equal(pdf.numPages, 1, "El ejemplo debe caber en una hoja Carta");
for (let i = 1; i <= pdf.numPages; i++) {
  const page = await pdf.getPage(i),
    viewport = page.getViewport({ scale: 1.6 }),
    canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  assert.equal(page.view[2], 612);
  assert.equal(page.view[3], 792);
  await page.render({ canvas, canvasContext: canvas.getContext("2d"), viewport }).promise;
  await fs.writeFile("output/qa/proforma-page-" + i + ".png", canvas.toBuffer("image/png"));
  const text = await page.getTextContent();
  const content = text.items.map((x) => x.str ?? "").join(" ");
  for (const expected of [
    "CREAR PC",
    "PRO-2026-00001",
    "Cliente de ejemplo",
    "TOTAL",
    "3.200",
    "Válida hasta",
    "Consultá la versión web",
    "Cotización no fiscal",
  ]) {
    assert(content.includes(expected), "Falta texto PDF: " + expected);
  }
  await fs.writeFile("output/qa/proforma-text.txt", content);
}
console.log(
  "PDF: Carta 612x792 pt; una página; marca, cliente, total y condiciones presentes. PNG generado.",
);
