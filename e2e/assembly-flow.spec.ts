import { expect, test } from "@playwright/test";

test("armar por pasos permite añadir, editar propiedad y recuperar categorías pendientes", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/build");
  const progress = page.getByRole("region", { name: "Progreso de tu equipo", exact: true });
  const summary = page.getByRole("complementary", { name: "Resumen del build", exact: true });
  await expect(progress).toContainText("8 categorías pendientes");
  await page.getByRole("button", { name: "Elegir próxima pieza", exact: false }).click();
  await page.getByRole("searchbox").fill("sin-coincidencias");
  await page.getByRole("button", { name: "Limpiar búsqueda", exact: true }).click();
  await page.getByRole("button", { name: "Añadir al build", exact: false }).click();
  await expect(progress).toContainText("7 categorías pendientes");
  await expect(page.locator(".selection-feedback")).toContainText("se añadió a tu equipo");
  await summary.getByRole("checkbox", { name: "Ya tengo AMD Ryzen 5 9600X", exact: true }).check();
  await expect(summary.locator(".selected-parts")).toContainText("Propio · fuera de cotización");
  await summary.getByRole("button", { name: "Cambiar procesador", exact: false }).click();
  await expect(page.locator(".category-toolbar h2")).toBeFocused();
  await page.getByRole("button", { name: "Continuar", exact: false }).click();
  await expect(page.locator(".category-toolbar h2")).toHaveText("Placa madre");
  await page.getByRole("button", { name: "Añadir al build", exact: false }).click();
  await expect(progress).toContainText("6 categorías pendientes");
  await summary.getByRole("button", { name: "Quitar AMD Ryzen 5 9600X", exact: true }).click();
  await summary
    .locator(".missing-parts")
    .getByRole("button", { name: "Procesador", exact: false })
    .click();
  await expect(page.locator(".category-toolbar h2")).toHaveText("Procesador");
  await expect(page.getByRole("button", { name: "Añadir al build", exact: false })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
});
