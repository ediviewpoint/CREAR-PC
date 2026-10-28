import { expect, test } from "@playwright/test";

test.describe("Landing", () => {
  test("muestra el hero con dos CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: /comenzar build/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /ya tengo mis componentes/i })).toBeVisible();
  });

  test("el link del hero lleva a /build", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /comenzar build/i }).click();
    await expect(page).toHaveURL(/\/build/);
  });

  test("el footer linkea a políticas", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /garant[ií]a/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /privacidad/i }).first()).toBeVisible();
  });
});
