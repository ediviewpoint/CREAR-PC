import fs from "node:fs/promises";
import { chromium, expect } from "@playwright/test";

const browser = await chromium.launch({
  executablePath:
    process.env.QA_CHROMIUM || "C:/Program Files/Google/Chrome/Application/chrome.exe",
});
const samples = [];
try {
  const page = await browser.newPage({ reducedMotion: "reduce" });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const base = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3003";
  await page.goto(`${base}/build`);
  await expect(page.locator(".category-guide")).toBeVisible();
  for (const colorScheme of ["light", "dark"]) {
    await page.emulateMedia({ colorScheme });
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      ).toBe(true);
    }
    const colors = await page.evaluate(() => {
      const selectors = [
        ".category-toolbar h2",
        ".category-purpose",
        ".category-guide strong",
        ".category-guide p span",
        ".selection-feedback",
        ".build-summary > h2",
        ".missing-parts > button",
        ".component-card__body > button",
      ];
      return selectors.map((selector) => {
        const element = document.querySelector(selector);
        let background = "rgb(255, 255, 255)";
        for (let node = element; node; node = node.parentElement) {
          const color = getComputedStyle(node).backgroundColor;
          if (!color.includes("rgba") && color !== "transparent") {
            background = color;
            break;
          }
        }
        return { selector, foreground: getComputedStyle(element).color, background };
      });
    });
    const luminance = (color) => {
      const rgb = color
        .match(/[\d.]+/g)
        .slice(0, 3)
        .map(Number)
        .map((n) => n / 255)
        .map((n) => (n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4));
      return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
    };
    for (const color of colors) {
      const fg = luminance(color.foreground),
        bg = luminance(color.background);
      const contrast = (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
      samples.push({ colorScheme, ...color, contrast: Number(contrast.toFixed(2)) });
      expect(contrast).toBeGreaterThanOrEqual(4.5);
    }
    await page.screenshot({ path: `output/review/usability-${colorScheme}.png`, fullPage: true });
  }
  expect(errors).toEqual([]);
  await fs.writeFile("output/review/usability-contrast.json", JSON.stringify(samples, null, 2));
  console.log(
    "16 muestras de contraste ≥ 4.5:1; cuatro anchos en claro/oscuro sin desbordes ni errores JS. Revisión parcial, no certificación WCAG.",
  );
} finally {
  await browser.close();
}
