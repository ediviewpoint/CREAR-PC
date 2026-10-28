import path from "node:path";
import { chromium, expect } from "@playwright/test";
const browser = await chromium.launch({
  headless: true,
  executablePath: path.join(
    process.env.LOCALAPPDATA,
    "ms-playwright/chromium-1243/chrome-win64/chrome.exe",
  ),
});
try {
  const p = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
    reducedMotion: "reduce",
    colorScheme: "light",
  });
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("http://127.0.0.1:3002/build", { waitUntil: "networkidle" });
  const preview = p.getByRole("region", { name: "Vista conceptual de tu equipo", exact: true });
  await expect(preview).toHaveCSS("container-type", "inline-size");
  await preview.screenshot({ path: "output/review/preview-studio-empty.png" });
  await p.getByRole("button", { name: "Cargar equipo de prueba", exact: true }).click();
  await preview.screenshot({ path: "output/review/preview-studio-assembled.png" });
  await preview.getByRole("button", { name: "Por piezas", exact: true }).click();
  await preview
    .locator(".preview-canvas")
    .screenshot({ path: "output/review/preview-studio-exploded.png" });
  await preview.getByRole("button", { name: "Categorías", exact: true }).click();
  await preview.screenshot({ path: "output/review/preview-studio-categories.png" });
  await p.emulateMedia({ colorScheme: "dark" });
  await preview.screenshot({ path: "output/review/preview-studio-dark.png" });
  await p.setViewportSize({ width: 320, height: 1000 });
  await preview.getByRole("button", { name: "Mostrar vista", exact: true }).click();
  await preview.screenshot({ path: "output/review/preview-studio-mobile.png" });
  expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await preview.getByRole("button", { name: "Ensamblado", exact: true }).click();
  await preview
    .locator(".preview-canvas")
    .screenshot({ path: "output/review/preview-studio-mobile-map.png" });
  expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  expect(errors).toEqual([]);
  console.log(
    "7 capturas: vacío, ensamblado, despiece, categorías, oscuro y móvil 320px; sin desbordes ni errores JS.",
  );
} finally {
  await browser.close();
}
