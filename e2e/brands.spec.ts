import { expect, test } from "@playwright/test";
test("las marcas confirmadas tienen identificación local y no amplían el catálogo", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#marcas");
  const brands = page.locator(".worked-brands");
  await brands.scrollIntoViewIfNeeded();
  await expect(brands.locator(".worked-brand")).toHaveCount(19);
  await expect(brands.locator("img")).toHaveCount(17);
  await expect(brands.locator(".worked-brand__name")).toHaveCount(2);
  for (const image of await brands.locator("img").all()) await image.scrollIntoViewIfNeeded();
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

test("un logo que no carga conserva el nombre de la marca", async ({ page }) => {
  await page.route("**/brands/kingston.svg", (route) => route.abort());
  await page.goto("/catalog");
  const card = page.locator(".component-card").filter({ hasText: "Kingston FURY" });
  await card.scrollIntoViewIfNeeded();
  await expect(card.locator(".component-card__brand .preview-brand__name")).toHaveText("Kingston");
  await expect(card.getByRole("link", { name: /Kingston FURY/ })).toBeVisible();
});
