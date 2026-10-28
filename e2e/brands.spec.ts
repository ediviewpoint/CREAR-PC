import { expect, test } from "@playwright/test";
test("las marcas confirmadas tienen identificación local y no amplían el catálogo", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#marcas");
  const brands = page.locator(".worked-brands");
  await brands.scrollIntoViewIfNeeded();
  await expect(brands.locator(".worked-brand")).toHaveCount(19);
  for (const name of [
    "Toshiba",
    "Seagate",
    "Western Digital",
    "Hitachi",
    "Kingston",
    "Crucial",
    "MSI",
    "Hikvision",
    "TEAMGROUP",
    "Apacer",
    "PUSKILL",
    "Diamond",
  ]) {
    await expect(brands.getByRole("heading", { name, exact: true })).toHaveCount(1);
  }
  await expect(brands.getByRole("heading", { name: "Intel", exact: true })).toHaveCount(1);
  await expect
    .poll(() =>
      brands.locator("img").evaluateAll((images) =>
        images.every((image) => {
          const img = image as HTMLImageElement;
          return (
            img.tagName === "IMG" &&
            img.complete &&
            img.naturalWidth > 0 &&
            new URL(img.currentSrc).origin === location.origin
          );
        }),
      ),
    )
    .toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
  await page.goto("/catalog");
  await expect(page.locator(".component-card")).toHaveCount(8);
});
