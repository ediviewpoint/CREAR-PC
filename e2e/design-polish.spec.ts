import { expect, test } from "@playwright/test";
test("el catálogo permite inspeccionar piezas y recuperar filtros vacíos", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/catalog");
  await expect(
    page
      .getByRole("navigation", { name: "Principal", exact: true })
      .getByRole("link", { name: "Componentes", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  const trigger = page.locator(".zoom-trigger").first();
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".inspect-specs > div")).not.toHaveCount(0);
  await expect(dialog.getByRole("link", { name: "Ver ficha técnica", exact: false })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await page.getByRole("searchbox").fill("no-existe-esta-pieza");
  await expect(page.locator(".component-card")).toHaveCount(0);
  await page.getByRole("button", { name: "Ver todas las piezas", exact: true }).click();
  await expect(page.locator(".component-card")).toHaveCount(8);
});
test("el configurador indica la selección y permite saltar al resumen móvil", async ({
  page,
  isMobile,
}) => {
  await page.goto("/build?component=amd-ryzen-5-9600x");
  await expect(page.locator(".card-selected")).toContainText("En tu equipo");
  await expect(
    page
      .getByRole("navigation", { name: "Principal", exact: true })
      .getByRole("link", { name: "Armar mi PC", exact: false }),
  ).toHaveAttribute("aria-current", "page");
  if (isMobile) {
    await page.getByRole("link", { name: /Ver mi equipo/ }).click();
    await expect(page).toHaveURL(/#build-summary$/);
    await expect(page.locator("#build-summary")).toBeInViewport();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
});
