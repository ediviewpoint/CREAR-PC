import { chromium, expect } from "@playwright/test";
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.QA_CHROMIUM || "C:/Program Files/Google/Chrome/Application/chrome.exe",
});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
    reducedMotion: "reduce",
    colorScheme: "light",
  });
  await page.goto(`${process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3003"}/#marcas`, {
    waitUntil: "networkidle",
  });
  const brands = page.locator(".worked-brands");
  await brands.scrollIntoViewIfNeeded();
  await expect(brands.locator("img")).toHaveCount(17);
  await expect(brands.locator(".worked-brand")).toHaveCount(19);
  await expect(brands.locator(".worked-brand__name")).toHaveCount(2);
  for (const image of await brands.locator("img").all()) await image.scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      brands
        .locator("img")
        .evaluateAll((imgs) => imgs.every((img) => img.complete && img.naturalWidth > 0)),
    )
    .toBe(true);
  await brands.screenshot({ path: "output/review/marcas-claro.png" });
  await page.emulateMedia({ colorScheme: "dark" });
  await brands.screenshot({ path: "output/review/marcas-oscuro.png" });
  await page.setViewportSize({ width: 320, height: 1000 });
  await brands.scrollIntoViewIfNeeded();
  await brands.screenshot({ path: "output/review/marcas-movil.png" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
  console.log(
    "19 marcas: 17 logos locales y 2 nombres pendientes de identificación/archivo; claro, oscuro y 320px sin desborde.",
  );
} finally {
  await browser.close();
}
