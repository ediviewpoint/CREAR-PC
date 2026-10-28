import path from "node:path";
import { chromium, expect } from "@playwright/test";
const base = process.env.QA_BASE_URL ?? "http://localhost:3002";
const browser = await chromium.launch({
  headless: true,
  executablePath: path.join(
    process.env.LOCALAPPDATA,
    "ms-playwright/chromium-1243/chrome-win64/chrome.exe",
  ),
});
try {
  const p = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
    colorScheme: "light",
  });
  await p.goto(base + "/catalog", { waitUntil: "networkidle" });
  await expect(p.locator("body")).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await p.locator(".zoom-trigger").first().click();
  const dialog = p.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.screenshot({ path: "output/review/modal-pulido-escritorio.png" });
  await p.keyboard.press("Escape");
  await p.emulateMedia({ colorScheme: "dark" });
  await p.locator(".zoom-trigger").first().click();
  await dialog.screenshot({ path: "output/review/modal-pulido-oscuro.png" });
  await p.keyboard.press("Escape");
  await p.setViewportSize({ width: 320, height: 900 });
  await p.locator(".zoom-trigger").first().click();
  await dialog.screenshot({ path: "output/review/modal-pulido-movil.png" });
  await p.keyboard.press("Escape");
  await p.goto(base + "/#marcas", { waitUntil: "networkidle" });
  await p
    .locator(".worked-brands")
    .screenshot({ path: "output/review/marcas-goline-vector-movil.png" });
  expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  console.log("Modales PC, oscuro y móvil; Goline vectorial; CSS cargado y sin desborde.");
} finally {
  await browser.close();
}
