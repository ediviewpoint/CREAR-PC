import { expect, test } from "@playwright/test";

test("consultar una ficha conserva el equipo, el nombre, las cantidades y las piezas propias", async ({
  page,
}) => {
  await page.goto("/build");
  await page.getByRole("button", { name: "Cargar equipo de prueba", exact: true }).click();
  await page.getByLabel("Nombre del build").fill("Equipo de trabajo");
  await page.getByRole("checkbox", { name: "Ya tengo AMD Ryzen 5 9600X", exact: true }).check();
  await page.getByRole("spinbutton", { name: /Cantidad de Kingston/ }).fill("2");
  await expect
    .poll(() =>
      page.evaluate(() => JSON.parse(sessionStorage.getItem("crearpc.build.draft")!).name),
    )
    .toBe("Equipo de trabajo");
  await page.locator(".component-card h3 a").click();
  await page.getByRole("link", { name: "Usar en mi build", exact: false }).click();
  await expect(page.locator(".selected-parts > li")).toHaveCount(8);
  await expect(page.getByLabel("Nombre del build")).toHaveValue("Equipo de trabajo");
  await expect(
    page.getByRole("checkbox", { name: "Ya tengo AMD Ryzen 5 9600X", exact: true }),
  ).toBeChecked();
  await expect(page.getByRole("spinbutton", { name: /Cantidad de Kingston/ })).toHaveValue("2");
  await page.reload();
  await expect(page.locator(".selected-parts > li")).toHaveCount(8);
  await expect(page.getByRole("spinbutton", { name: /Cantidad de Kingston/ })).toHaveValue("2");
});

test("la pieza de la URL se combina con el borrador y deshacer recupera la selección", async ({
  page,
}) => {
  await page.goto("/build");
  await page.getByRole("button", { name: "Añadir al build", exact: false }).click();
  await page.goto("/build?component=samsung-990-pro-1tb");
  await expect(page.locator(".selected-parts > li")).toHaveCount(2);
  await page.getByRole("button", { name: "Quitar AMD Ryzen 5 9600X", exact: true }).click();
  await expect(page.locator(".selected-parts > li")).toHaveCount(1);
  await page.getByRole("button", { name: "Deshacer último cambio", exact: false }).click();
  await expect(page.locator(".selected-parts > li")).toHaveCount(2);
  await page.getByRole("button", { name: "Cargar equipo de prueba", exact: true }).click();
  await expect(page.locator(".selected-parts > li")).toHaveCount(8);
  await page.getByRole("button", { name: "Deshacer último cambio", exact: false }).click();
  await expect(page.locator(".selected-parts > li")).toHaveCount(2);
});

test("borrador dañado y almacenamiento bloqueado no impiden elegir piezas", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("crearpc.build.draft", "invalid-json"));
  await page.goto("/build");
  await expect(page.locator(".selected-parts > li")).toHaveCount(0);
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new Error("Storage unavailable");
    };
  });
  await page.getByRole("button", { name: "Añadir al build", exact: false }).click();
  await expect(page.locator(".selected-parts > li")).toHaveCount(1);
  await page.getByRole("button", { name: "Guardar build", exact: true }).click();
  await expect(page.locator(".build-summary").getByRole("alert")).toContainText(
    "No se pudo guardar en esta pestaña",
  );
});

test("el selector precede a la vista conceptual", async ({ page }) => {
  await page.goto("/build");
  const selector = page.locator(".category-toolbar");
  await expect(selector).toBeVisible();
  const preview = page.getByRole("region", { name: "Vista conceptual de tu equipo", exact: true });
  expect((await selector.boundingBox())!.y).toBeLessThan((await preview.boundingBox())!.y);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
});
