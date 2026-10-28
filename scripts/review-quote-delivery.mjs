import fs from "node:fs/promises";
import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";
import { createCanvas, DOMMatrix, ImageData, Path2D } from "@napi-rs/canvas";

const browser = await chromium.launch({
  executablePath:
    process.env.QA_CHROMIUM || "C:/Program Files/Google/Chrome/Application/chrome.exe",
});
const file = "output/pdf/ELITEPC-borrador-revision.pdf";
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  await page.goto(`${process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3003"}/build`);
  await page.getByRole("button", { name: "Cargar equipo de prueba", exact: true }).click();
  await page.getByRole("button", { name: "Preparar borrador local", exact: true }).click();
  const link = page.getByRole("link", { name: "Descargar PDF", exact: false });
  await expect(link).toBeVisible({ timeout: 60000 });
  const pending = page.waitForEvent("download");
  await link.click();
  await fs.mkdir("output/pdf", { recursive: true });
  await (await pending).saveAs(file);
  await page.screenshot({ path: "output/review/quote-delivery-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 320, height: 900 });
  await page.screenshot({ path: "output/review/quote-delivery-mobile.png", fullPage: true });
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1))
    console.log(
      await page.evaluate(() =>
        [...document.querySelectorAll("main *")]
          .filter((element) => element.getBoundingClientRect().right > innerWidth + 1)
          .map((element) => ({
            tag: element.tagName,
            className: element.className,
            width: element.getBoundingClientRect().width,
          }))
          .slice(0, 15),
      ),
    );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
  await page.screenshot({ path: "output/review/quote-delivery-mobile.png", fullPage: true });
} finally {
  await browser.close();
}

Object.assign(globalThis, { DOMMatrix, ImageData, Path2D });
const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
const pdf = await getDocument({
  data: new Uint8Array(await fs.readFile(file)),
  useSystemFonts: true,
}).promise;
assert.equal(pdf.numPages, 1, "El borrador de ocho piezas debe caber en una hoja.");
const page = await pdf.getPage(1);
assert.equal(page.view[2], 612);
assert.equal(page.view[3], 792);
const content = (await page.getTextContent()).items.map((item) => item.str ?? "").join(" ");
for (const text of [
  "BORRADOR",
  "P. unitario",
  "Importe",
  "Por cotizar",
  "TOTAL",
  "Ryzen",
  "Kingston",
  "DeepCool",
  "Sin enlace público",
])
  assert(content.includes(text), `Falta ${text}`);
assert(
  !content.includes("Consultá la versión web"),
  "El borrador no debe prometer un enlace público.",
);
const viewport = page.getViewport({ scale: 1.6 });
const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
await page.render({ canvas, canvasContext: canvas.getContext("2d"), viewport }).promise;
await fs.writeFile("output/review/quote-delivery-pdf.png", canvas.toBuffer("image/png"));
await fs.writeFile(
  "output/review/quote-delivery-report.json",
  JSON.stringify(
    { file, pages: pdf.numPages, size: "Carta", status: "Borrador; precios y cliente pendientes" },
    null,
    2,
  ),
);
console.log(`${file}: una hoja Carta, ocho piezas y precios pendientes explícitos.`);
