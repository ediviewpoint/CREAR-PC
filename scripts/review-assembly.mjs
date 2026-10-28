import { chromium, expect } from "@playwright/test";

const browser = await chromium.launch({
  executablePath: process.env.QA_CHROMIUM || "C:/Program Files/Google/Chrome/Application/chrome.exe",
});
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, reducedMotion: "reduce" });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3003"}/build`, { waitUntil: "domcontentloaded" });
  await expect(page.locator(".assembly-progress")).toBeVisible();
  await expect(page.locator(".hardware-study").first()).toBeVisible();
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  await page.locator(".component-card__brand").scrollIntoViewIfNeeded();
  await page.locator(".component-card__brand img").evaluateAll((images) => Promise.all(images.map((image) => image.decode())));
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: "output/review/assembly-desktop.png", fullPage: true });
  await page.getByRole("button", { name: "Elegir próxima pieza", exact: false }).click();
  await page.getByRole("button", { name: "Añadir al build", exact: false }).click();
  await page.locator(".component-card__brand").screenshot({ path: "output/review/assembly-brand.png" });
  await page.locator(".category-toolbar").screenshot({ path: "output/review/assembly-category.png" });
  await page.emulateMedia({ colorScheme: "dark" });
  await page.screenshot({ path: "output/review/assembly-dark.png", fullPage: true });
  await page.setViewportSize({ width: 320, height: 900 });
  await page.emulateMedia({ colorScheme: "light" });
  await page.locator("h1").click();
  await page.screenshot({ path: "output/review/assembly-mobile.png", fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  expect(errors).toEqual([]);
  console.log("Escritorio, oscuro y móvil 320 px: sin desbordes ni errores JavaScript.");
} finally {
  await browser.close();
}
