// Read-only review against a local production server using the configured database.
// Does not create products, prices, quotes or uploads, and never prints credentials.
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const require = createRequire(import.meta.url);
createRequire(require.resolve("next/package.json"))("@next/env").loadEnvConfig(process.cwd());
const origin = "http://127.0.0.1:3005";
if (!process.env.ADMIN_PASSWORD) throw new Error("Falta ADMIN_PASSWORD.");
const browser = await chromium.launch(
  process.env.QA_CHROMIUM ? { executablePath: process.env.QA_CHROMIUM } : {},
);
let stage = "login";
try {
  const page = await browser.newPage();
  await page.goto(`${origin}/`);
  await page.setViewportSize({ width: 320, height: 812 });
  if (!(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)))
    throw new Error("La navegación pública desborda en móvil.");
  await mkdir("output/review", { recursive: true });
  await page.screenshot({ path: "output/review/web-admin-entry-mobile.png" });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page
    .getByRole("navigation", { name: "Principal", exact: true })
    .getByRole("link", { name: "Administración", exact: true })
    .click();
  await page.waitForURL(`${origin}/admin/login`);
  await page.locator('[name="password"]').fill(process.env.ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Ingresar", exact: true }).click();
  await page.waitForURL(`${origin}/admin`);
  await page.screenshot({ path: "output/review/connected-admin-overview.png" });
  stage = "connected-product-list";
  await page.goto(`${origin}/admin/componentes`);
  await page.getByRole("link", { name: "Añadir producto +", exact: true }).waitFor();
  const rows = page.locator(".product-list tbody tr");
  const products = await rows.count();
  if (!products) throw new Error("No se cargaron productos para revisar.");
  stage = "existing-product-editor-and-warranty";
  await rows.first().getByRole("link", { name: "Editar", exact: true }).click();
  await page.locator('form.product-editor [name="warrantyMonths"]').waitFor();
  if (!(await page.locator('form.product-editor [name="name"]').inputValue()))
    throw new Error("No se cargó la ficha del producto.");
  stage = "integrated-price-and-stock-fields";
  await page.goto(`${origin}/admin/componentes/nuevo`);
  await page.getByRole("radio", { name: "Con precio", exact: true }).check();
  await page.locator('[name="priceAmount"]').fill("850.00");
  await page.locator('[name="priceStockQty"]').fill("4");
  await page.locator('[name="priceInStock"]').waitFor();
  await page.setViewportSize({ width: 375, height: 812 });
  if (!(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)))
    throw new Error("El formulario desborda en móvil.");
  await mkdir("output/review", { recursive: true });
  await page.screenshot({
    path: "output/review/connected-product-pricing-mobile.png",
    fullPage: true,
  });
  stage = "csv-import-page";
  await page.goto(`${origin}/admin/componentes/importar`);
  await page.getByRole("button", { name: "Validar y previsualizar" }).waitFor();
  stage = "catalog-without-invented-prices";
  await page.goto(`${origin}/catalog`);
  await page.locator(".component-card__price").first().waitFor();
  const displayedPrices = await page.locator(".component-card__price").allTextContents();
  if (!displayedPrices.length || !displayedPrices.every((text) => /precio por cotizar/i.test(text)))
    throw new Error("No se encontró el estado sin precio esperado.");
  stage = "anonymous-admin-access-redirect";
  const anonymous = await browser.newContext();
  const visitor = await anonymous.newPage();
  await visitor.goto(`${origin}/admin/componentes`);
  await visitor.waitForURL(`${origin}/admin/login`);
  await anonymous.close();
  const report = {
    passed: true,
    products,
    checked: [
      "login",
      "public-admin-entry",
      "connected-product-list",
      "existing-product-editor-and-warranty",
      "integrated-price-and-stock-fields",
      "csv-import-page",
      "catalog-without-invented-prices",
      "anonymous-admin-access-redirect",
    ],
    databaseWrites: false,
  };
  await mkdir("output/review", { recursive: true });
  await writeFile("output/review/connected-admin-report.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} catch {
  console.error(JSON.stringify({ passed: false, stage, databaseWrites: false }));
  console.error(
    "La revisión del panel conectado no pudo completarse. Revisá el servidor local en el puerto 3005 y su configuración; no se realizaron escrituras de datos desde este script.",
  );
  process.exitCode = 1;
} finally {
  await browser.close();
}
