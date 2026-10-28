import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";
import sharp from "sharp";
const base = process.env.QA_BASE_URL ?? "http://localhost:3000";
const out = path.resolve("output/qa");
await fs.mkdir(out, { recursive: true });
await fs.mkdir("output/pdf", { recursive: true });
const executable =
  process.env.QA_CHROMIUM ??
  path.join(process.env.LOCALAPPDATA, "ms-playwright/chromium-1243/chrome-win64/chrome.exe");
const browser = await chromium.launch({ headless: true, executablePath: executable });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  colorScheme: "light",
});
const page = await context.newPage();
page.setDefaultTimeout(15000);
page.setDefaultNavigationTimeout(60000);
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const results = [];
async function noOverflow(label) {
  const sizes = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  assert(sizes.scroll <= sizes.client + 1, label + ": " + JSON.stringify(sizes));
  results.push(label + " sin overflow");
}
try {
  await page.goto(base, { waitUntil: "networkidle" });
  assert.match(await page.title(), /CREAR PC/);
  assert.equal(
    await page.locator('a[href="/build"]').filter({ hasText: "Comenzar build" }).count(),
    1,
  );
  assert.equal(await page.locator('a[href="/build?mode=existing"]').count(), 1);
  assert.equal(
    new URL(await page.locator('meta[property="og:image"]').getAttribute("content")).pathname,
    "/brand/og-default.png",
  );
  await noOverflow("Landing 1440");
  await page.screenshot({
    path: path.join(out, "landing-light-1440.png"),
    fullPage: true,
    animations: "disabled",
  });
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator(".hero__actions .button").first()).toHaveCSS(
    "background-color",
    "rgb(191, 212, 240)",
  );
  await page.screenshot({ path: path.join(out, "landing-dark-1440.png"), fullPage: true });
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator(".hero__actions .button").first()).toHaveCSS(
    "background-color",
    "rgb(19, 40, 74)",
  );
  await page.setViewportSize({ width: 320, height: 800 });
  await noOverflow("Landing 320");
  await page.screenshot({ path: path.join(out, "landing-light-320.png"), fullPage: true });
  await page.goto(base + "/catalog", { waitUntil: "networkidle" });
  await noOverflow("CatÃ¡logo 320");
  assert((await page.locator(".component-card").count()) > 0, "CatÃ¡logo no vacÃ­o");
  const firstName = await page.locator(".component-card h3").first().innerText();
  await page.getByRole("searchbox").fill("No-existe-esta-pieza");
  await expect(page.locator(".component-card")).toHaveCount(0);
  await page.getByRole("button", { name: "Limpiar", exact: true }).click();
  assert((await page.locator(".component-card").count()) > 0);
  await page.locator(".zoom-trigger").first().click();
  assert((await page.locator("dialog[open]").count()) === 1);
  await page.keyboard.press("Escape");
  assert((await page.locator("dialog[open]").count()) === 0);
  await page.locator(".component-card h3 a").first().click();
  await page.waitForURL(/\/catalog\/(cpu|gpu|mobo|ram|storage|psu|case|cooler)\//);
  assert.equal(await page.locator("h1").innerText(), firstName);
  await noOverflow("Ficha 320");
  await page.screenshot({ path: path.join(out, "component-light-320.png"), fullPage: true });
  await page.goto(base + "/build?mode=existing&component=amd-ryzen-5-9600x", {
    waitUntil: "networkidle",
  });
  assert.equal(await page.locator(".selected-parts li").count(), 1);
  assert.match(await page.locator(".selected-parts").innerText(), /Propio/);
  assert.match(await page.locator(".compat-status").innerText(), /parcial/i);
  assert(await page.getByRole("button", { name: /Generar proforma/ }).isDisabled());
  assert.equal(await page.locator(".candidate-card:visible").count(), 1);
  await expect(page.getByRole("button", { name: "Pieza siguiente", exact: true })).toBeDisabled();
  await noOverflow("Build 320");
  await page.screenshot({ path: path.join(out, "build-light-320.png"), fullPage: true });
  await page.getByRole("button", { name: /Siguiente/ }).click();
  assert.equal(await page.locator(".category-toolbar h2").innerText(), "Placa madre");
  await page
    .locator(".category-viewport")
    .dispatchEvent("touchstart", { touches: [{ identifier: 1, clientX: 250, clientY: 200 }] });
  await page
    .locator(".category-viewport")
    .dispatchEvent("touchend", { changedTouches: [{ identifier: 1, clientX: 100, clientY: 204 }] });
  assert.equal(await page.locator(".category-toolbar h2").innerText(), "Memoria");
  await page.getByRole("button", { name: /Anterior/ }).click();
  assert.equal(await page.locator(".category-toolbar h2").innerText(), "Placa madre");
  await page.setViewportSize({ width: 768, height: 1000 });
  await noOverflow("Build 768");
  assert(await page.locator(".category-rail").isVisible());
  assert(!(await page.locator(".wizard-controls").isVisible()));
  await page.screenshot({ path: path.join(out, "build-light-768.png"), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator(".category-rail button").first().click();
  await noOverflow("Build 1440");
  await page.waitForFunction(() => {
    const el = document.querySelector(".category-viewport > section");
    return (
      el &&
      Number(getComputedStyle(el).opacity) > 0.99 &&
      document.querySelectorAll(".candidate-card").length > 0
    );
  });
  await page.screenshot({ path: path.join(out, "build-light-1440.png"), fullPage: true });
  await page.emulateMedia({ colorScheme: "dark" });
  await page.screenshot({ path: path.join(out, "build-dark-1440.png"), fullPage: true });
  await page.setViewportSize({ width: 320, height: 800 });
  await noOverflow("Build oscuro 320");
  await page.screenshot({ path: path.join(out, "build-dark-320.png"), fullPage: true });
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
  await page.goto(base, { waitUntil: "networkidle" });
  await page.mouse.move(180, 500);
  const transform = await page
    .locator(".case-stage__object")
    .evaluate((el) => getComputedStyle(el).transform);
  assert.equal(transform, "none");
  results.push("Reduced-motion: objeto estÃ¡tico");
  await page.goto(base + "/proforma/ejemplo", { waitUntil: "networkidle" });
  await noOverflow("Proforma 320");
  await page.screenshot({ path: path.join(out, "proforma-light-320.png"), fullPage: true });
  const pdf = await context.request.get(base + "/api/proforma/ejemplo/pdf");
  assert.equal(pdf.status(), 200);
  const pdfBytes = await pdf.body();
  assert.equal(pdfBytes.subarray(0, 4).toString(), "%PDF");
  await fs.writeFile("output/pdf/crear-pc-ejemplo.pdf", pdfBytes);
  const og = await context.request.get(base + "/api/og/proforma/ejemplo");
  assert.equal(og.status(), 200);
  const ogBytes = await og.body();
  const size = await sharp(ogBytes).metadata();
  assert.equal(size.width, 1200);
  assert.equal(size.height, 630);
  await fs.writeFile(path.join(out, "og-proforma-ejemplo.png"), ogBytes);
  assert.equal((await context.request.get(base + "/api/og/proforma/inexistente")).status(), 404);
  assert.equal((await context.request.get(base + "/api/proforma/inexistente/pdf")).status(), 404);
  for (const n of [16, 32, 48, 180]) {
    const s = await sharp("public/brand/favicon-" + n + ".png").metadata();
    assert.equal(s.width, n);
    assert.equal(s.height, n);
  }
  assert.equal(errors.length, 0, "Errores de navegador: " + errors.join("; "));
  results.push(
    "Filtros y ficha del catÃ¡logo; modal Escape",
    "SelecciÃ³n propia, validaciÃ³n parcial y bloqueo de proforma",
    "Wizard con botones y swipe",
    "PDF real y OG 1200x630; IDs desconocidos 404",
    "Favicons 16/32/48/180",
  );
  await fs.writeFile(
    path.join(out, "verification.json"),
    JSON.stringify({ base, results, browserErrors: errors }, null, 2),
  );
  console.log(results.join("\n"));
} finally {
  await browser.close();
}
