import { expect, test } from "@playwright/test";
test("vista conceptual refleja selección, categorías y piezas separadas", async ({
  page,
  isMobile,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/build");
  const preview = page.getByRole("region", { name: "Vista conceptual de tu equipo", exact: true });
  await expect(preview).toBeVisible();
  await expect(preview).toHaveCSS("container-type", "inline-size");
  await expect(preview).toHaveCSS("container-type", "inline-size");
  if (isMobile) await preview.getByRole("button", { name: "Mostrar vista", exact: true }).click();
  await expect(preview.locator('[data-part][data-installed="true"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Cargar equipo de prueba", exact: true }).click();
  await expect(preview.locator('[data-part][data-installed="true"]')).toHaveCount(8);
  await expect(preview.locator(".preview-focus")).toContainText("AMD Ryzen 5 9600X");
  const gpu = preview.locator('[data-part="gpu"]');
  const initial = await gpu.evaluate((el) => getComputedStyle(el).transform);
  await preview.getByRole("button", { name: "Por piezas", exact: true }).click();
  await expect(preview.locator("svg.case-drawing")).toHaveAttribute("data-exploded", "true");
  await expect.poll(() => gpu.evaluate((el) => getComputedStyle(el).transform)).not.toBe(initial);
  await preview.getByRole("button", { name: "Tarjeta gráfica, seleccionado", exact: true }).click();
  await expect(preview.locator(".preview-focus")).toContainText("NVIDIA GeForce RTX 4060");
  await expect(gpu).toHaveAttribute("data-active", "true");
  await page.getByRole("button", { name: "Quitar NVIDIA GeForce RTX 4060", exact: true }).click();
  await expect(gpu).toHaveAttribute("data-installed", "false");
  await expect(preview.locator(".preview-focus")).toContainText("Todavía no elegiste");
  await expect(preview.locator('[data-part][data-installed="true"]')).toHaveCount(7);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
});

test("categorías, marcas e inspector siguen la selección real", async ({ page, isMobile }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/build");
  const preview = page.getByRole("region", { name: "Vista conceptual de tu equipo", exact: true });
  if (isMobile) await preview.getByRole("button", { name: "Mostrar vista", exact: true }).click();
  await page.getByRole("button", { name: "Cargar equipo de prueba", exact: true }).click();
  await expect(
    preview.locator(".preview-focus").getByRole("img", { name: "AMD Ryzen", exact: true }),
  ).toBeVisible();
  await preview.getByRole("button", { name: "Categorías", exact: true }).click();
  await expect(preview.locator(".preview-stage")).toHaveCount(0);
  await expect(preview.locator(".preview-category-grid > button")).toHaveCount(8);
  await expect(preview.locator(".preview-category-model")).toHaveCount(8);
  await preview.getByRole("checkbox", { name: "Marcas", exact: true }).uncheck();
  await expect(preview.locator(".preview-brand")).toHaveCount(0);
  await expect(preview.locator(".preview-category-model")).toHaveCount(8);
  await preview.getByRole("checkbox", { name: "Marcas", exact: true }).check();
  await preview.getByRole("button", { name: "Placa madre, seleccionado", exact: true }).click();
  await expect(preview.locator(".preview-focus")).toContainText("ASUS PRIME B650M-A WiFi");
  await expect(
    preview.locator(".preview-focus").getByRole("img", { name: "ASUS", exact: true }),
  ).toBeVisible();
  await preview.getByRole("button", { name: "Ensamblado", exact: true }).click();
  await preview
    .getByRole("button", { name: "Ver Tarjeta gráfica en la vista", exact: true })
    .click();
  await expect(preview.locator(".preview-focus")).toContainText("NVIDIA GeForce RTX 4060");
  await expect(preview.locator(".preview-focus .preview-brand__name")).toHaveText("NVIDIA");
  await expect(preview.locator('[data-part="gpu"]')).toHaveAttribute("data-active", "true");
  await preview.getByRole("button", { name: "Cambiar pieza", exact: false }).click();
  await expect(page.locator(".category-toolbar h2")).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
});
