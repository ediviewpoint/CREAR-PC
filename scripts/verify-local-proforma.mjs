import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs/promises";
import { chromium } from "@playwright/test";
const browser = await chromium.launch({
  executablePath: path.join(
    process.env.LOCALAPPDATA,
    "ms-playwright/chromium-1243/chrome-win64/chrome.exe",
  ),
  headless: true,
});
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://localhost:3000/proforma/local", { waitUntil: "networkidle" });
  await page.evaluate(() =>
    sessionStorage.setItem(
      "crearpc.proforma.local",
      JSON.stringify({
        id: "local",
        code: "BORRADOR",
        draft: true,
        example: false,
        name: "QA local",
        client: { name: "Cliente QA" },
        issuer: { name: "CREAR PC", city: "Santa Cruz" },
        issuedAt: "2026-10-28",
        validUntil: "2026-11-04",
        items: [{ category: "RAM", name: "Pieza de prueba", quantity: 2, unitPriceBob: 450 }],
        discountBob: 0,
        terms: ["No es factura."],
      }),
    ),
  );
  await page.reload({ waitUntil: "networkidle" });
  await page.locator('iframe[src^="blob:"]').waitFor({ timeout: 60000 });
  assert((await page.getByRole("link", { name: /Descargar PDF/ }).count()) === 1);
  assert.equal(errors.length, 0, errors.join("; "));
  await fs.writeFile(
    "output/qa/local-proforma-verification.json",
    JSON.stringify({ localPdf: "pass", browserErrors: errors }, null, 2),
  );
  console.log(
    "Borrador local: carga validada, PDF cliente, iframe blob, descarga y sin errores de navegador.",
  );
} finally {
  await browser.close();
}
