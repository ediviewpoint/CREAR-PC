import { expect, test } from "@playwright/test";

test("quitar, deshacer y explorar mantienen un destino de foco útil", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/build");
  const add = page.getByRole("button", { name: "Añadir al build", exact: false });
  await add.focus();
  await page.keyboard.press("Enter");
  const remove = page.getByRole("button", { name: "Quitar AMD Ryzen 5 9600X", exact: true });
  await remove.focus();
  await page.keyboard.press("Enter");
  const undo = page.getByRole("button", { name: "Deshacer último cambio", exact: false });
  await expect(undo).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator(".build-summary > h2")).toBeFocused();
  await expect(page.locator(".selected-parts > li")).toHaveCount(1);
  const zoom = page.locator(".zoom-trigger").first();
  await zoom.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(zoom).toBeFocused();
});

test("texto ampliado y reduced-motion conservan el armado sin desbordes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/build");
  await page.getByRole("button", { name: "Añadir al build", exact: false }).waitFor();
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  await page.getByRole("button", { name: "Añadir al build", exact: false }).click();
  await expect(page.locator(".selected-parts > li")).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
  await expect(page.locator(".selected-parts .icon-button")).toHaveCSS("min-height", "44px");
});
