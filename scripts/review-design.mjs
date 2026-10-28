import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";
const out = "output/design-review";
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.QA_CHROMIUM ??
    path.join(process.env.LOCALAPPDATA, "ms-playwright/chromium-1243/chrome-win64/chrome.exe"),
});
const routes = [
  ["inicio", "/"],
  ["catalogo", "/catalog"],
  ["producto", "/catalog/cpu/amd-ryzen-5-9600x"],
  ["configurador", "/build"],
  ["garantia", "/politicas/garantia"],
  ["privacidad", "/politicas/privacidad"],
  ["terminos", "/politicas/terminos"],
  ["cookies", "/politicas/cookies"],
  ["proformas", "/politicas/proforma-condiciones"],
  ["contacto", "/contacto"],
  ["admin", "/admin/login"],
];
const checks = [],
  errors = [];
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    colorScheme: "light",
    reducedMotion: "reduce",
  });
  page.setDefaultTimeout(20000);
  page.on("pageerror", (e) => errors.push(e.message));
  for (const theme of ["light", "dark"]) {
    await page.emulateMedia({ colorScheme: theme });
    for (const width of [1440, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const [name, route] of routes) {
        const response = await page.goto("http://localhost:3000" + route, {
          waitUntil: "networkidle",
          timeout: 60000,
        });
        assert.equal(response.status(), 200, name);
        await expect(page.locator("main h1")).toHaveCount(1);
        const size = await page.evaluate(() => ({
          scroll: document.documentElement.scrollWidth,
          width: innerWidth,
        }));
        assert(size.scroll <= size.width + 1, name + " overflow " + JSON.stringify(size));
        if (name === "garantia") {
          await expect(page.locator(".legal-content")).toContainText("12 meses");
          await expect(page.locator(".legal-content")).toContainText("3 meses");
          const anchors = await page
            .locator(".policy-index nav a")
            .evaluateAll((nodes) =>
              nodes.map((a) => ({
                hash: a.hash,
                exists: !!document.getElementById(decodeURIComponent(a.hash.slice(1))),
              })),
            );
          assert(
            anchors.every((a) => a.exists),
            "Índice sin destinos",
          );
        }
        if (name === "catalogo") {
          await expect(page.locator(".component-card")).toHaveCount(8);
          await page.getByRole("button", { name: "Procesador", exact: true }).click();
          await expect(page.locator(".component-card")).toHaveCount(1);
          await page.getByRole("button", { name: /Todas las piezas/ }).click();
        }
        if (["inicio", "catalogo", "producto", "garantia", "contacto", "admin"].includes(name))
          await page.screenshot({
            path: out + "/" + name + "-" + theme + "-" + width + ".png",
            fullPage: true,
            animations: "disabled",
          });
        checks.push({ route, width, theme, status: "ok" });
      }
    }
  }
  assert.deepEqual(errors, [], "Errores de JavaScript");
  await fs.writeFile(out + "/report.json", JSON.stringify({ checks, errors }, null, 2));
  console.log(
    JSON.stringify({
      routes: routes.length,
      checks: checks.length,
      javascriptErrors: errors.length,
      status: "ok",
    }),
  );
} finally {
  await browser.close();
}
