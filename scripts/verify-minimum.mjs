import fs from "node:fs/promises";
import path from "node:path";
import { chromium, expect } from "@playwright/test";
import { createCanvas, DOMMatrix, ImageData, Path2D } from "@napi-rs/canvas";
Object.assign(globalThis, { DOMMatrix, ImageData, Path2D });
await fs.mkdir("output/review", { recursive: true });
await fs.mkdir("output/pdf", { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: path.join(
    process.env.LOCALAPPDATA,
    "ms-playwright/chromium-1243/chrome-win64/chrome.exe",
  ),
});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    colorScheme: "light",
  });
  await page.goto("http://localhost:3000/catalog", { waitUntil: "networkidle", timeout: 60000 });
  await expect(page.locator(".component-card")).toHaveCount(8);
  await page.screenshot({ path: "output/review/catalogo-minimo.png", animations: "disabled" });
  await page.goto("http://localhost:3000/build", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Cargar equipo de prueba", exact: true }).click();
  await page.getByRole("button", { name: "Preparar borrador local", exact: true }).click();
  const frame = page.locator('iframe[src^="blob:"]');
  await frame.waitFor({ timeout: 60000 });
  const url = await frame.getAttribute("src");
  const bytes = await page.evaluate(
    async (url) => Array.from(new Uint8Array(await (await fetch(url)).arrayBuffer())),
    url,
  );
  await fs.writeFile("output/pdf/crear-pc-borrador-minimo.pdf", new Uint8Array(bytes));
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const pdf = await getDocument({ data: new Uint8Array(bytes) }).promise;
  const text = (await (await pdf.getPage(1)).getTextContent()).items
    .map((item) => ("str" in item ? item.str : ""))
    .join(" ");
  expect(text).toContain("ELITEPC");
  expect(text).toContain("3 meses");
  expect(text).toContain("12 meses");
  expect(text).toContain("AMD Ryzen 5 9600X");
  expect(text).toContain("Por cotizar");
  for (let i = 1; i <= pdf.numPages; i++) {
    const p = await pdf.getPage(i),
      v = p.getViewport({ scale: 1.4 }),
      c = createCanvas(Math.ceil(v.width), Math.ceil(v.height));
    await p.render({ canvas: c, canvasContext: c.getContext("2d"), viewport: v }).promise;
    await fs.writeFile("output/review/borrador-minimo-" + i + ".png", c.toBuffer("image/png"));
  }
  console.log(
    JSON.stringify({
      components: 8,
      pdfPages: pdf.numPages,
      status: "Borrador generado sin precios inventados",
    }),
  );
} finally {
  await browser.close();
}
