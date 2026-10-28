import { expect, test } from "@playwright/test";
test("las políticas y contacto funcionan sin base de datos", async ({ page }) => {
  for (const route of [
    "/politicas/garantia",
    "/politicas/privacidad",
    "/politicas/terminos",
    "/politicas/cookies",
    "/politicas/proforma-condiciones",
    "/contacto",
  ]) {
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(page.locator("main h1")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true,
    );
  }
});
test("admin solicita ingreso y cron rechaza llamadas sin secreto", async ({ page, request }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByLabel("Contraseña de administración")).toBeVisible();
  for (const route of ["expire-proformas", "weekly-report", "refresh-prices"])
    expect((await request.get("/api/cron/" + route)).status()).toBe(401);
});
test("el PDF puede mostrarse en el iframe del mismo sitio", async ({ request }) => {
  const pdf = await request.get("/api/proforma/ejemplo/pdf?inline=1");
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()["x-frame-options"]).toBe("SAMEORIGIN");
  expect((await pdf.body()).subarray(0, 4).toString()).toBe("%PDF");
});

test("recupera selección local usando el catálogo actual", async ({ page }) => {
  await page.goto("/build");
  await page.evaluate(() =>
    sessionStorage.setItem(
      "crearpc.build.draft",
      JSON.stringify({
        name: "Build recuperado",
        items: [{ slug: "amd-ryzen-5-9600x", owned: true, quantity: 1 }],
      }),
    ),
  );
  await page.getByRole("button", { name: "Recuperar selección local", exact: true }).click();
  await expect(page.getByLabel("Nombre del build")).toHaveValue("Build recuperado");
  await expect(page.locator(".selected-parts li")).toHaveCount(1);
  await expect(page.locator(".selected-parts")).toContainText("Propio");
});

test("equipo mínimo: ocho piezas y borrador sin precios ficticios", async ({ page }) => {
  await page.goto("/catalog");
  await expect(page.locator(".component-card")).toHaveCount(8);
  await page.goto("/build");
  await page.getByRole("button", { name: "Cargar equipo de prueba", exact: true }).click();
  await expect(page.locator(".selected-parts li")).toHaveCount(8);
  await expect(page.locator(".compat-status")).toContainText("Sin conflictos");
  await expect(page.getByRole("button", { name: "Generar proforma", exact: false })).toBeDisabled();
  await page.getByRole("button", { name: "Preparar borrador local", exact: true }).click();
  await expect(page).toHaveURL(/\/proforma\/local/);
  await expect(page.locator(".proforma-paper")).toContainText("Por cotizar");
  await expect(page.locator('iframe[src^="blob:"]')).toBeVisible({ timeout: 60000 });
  await page.getByRole("link", { name: "Volver al configurador", exact: true }).click();
  await expect(page).toHaveURL(/\/build$/);
  await page.reload();
  await page.getByRole("button", { name: "Recuperar selección local", exact: true }).click();
  await expect(page.locator(".selected-parts li")).toHaveCount(8);
  await expect(page.locator(".compat-status")).toContainText("Sin conflictos");
});
