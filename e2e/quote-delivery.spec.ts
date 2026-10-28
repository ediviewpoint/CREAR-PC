import { expect, test } from "@playwright/test";

test("el borrador permite completar cliente y regenerar un PDF descargable", async ({ page }) => {
  await page.goto("/build");
  await page.getByRole("button", { name: "Cargar equipo de prueba", exact: true }).click();
  await page.getByRole("button", { name: "Preparar borrador local", exact: true }).click();
  await expect(page).toHaveURL(/\/proforma\/local$/);
  await page.getByText("Completar datos del cliente", { exact: true }).click();
  const form = page.locator(".draft-client-form");
  await form.getByLabel("Nombre del cliente", { exact: true }).fill("Cliente de revisión");
  await form.getByLabel("Teléfono (opcional)").fill("70000000");
  await form.getByRole("button", { name: "Actualizar borrador y PDF", exact: true }).click();
  const paper = page.getByRole("article", {
    name: "Contenido accesible de la proforma",
    exact: true,
  });
  await expect(paper).toContainText("Cliente de revisión");
  await expect(paper.locator("tbody > tr")).toHaveCount(8);
  await expect(paper).toContainText("P. unitario Bs.");
  await expect(paper).toContainText("Por cotizar");
  await expect(
    paper.getByRole("link", { name: "Consultá la versión web", exact: true }),
  ).toHaveCount(0);
  const link = page.getByRole("link", { name: "Descargar PDF", exact: false });
  await expect(link).toBeVisible({ timeout: 60000 });
  const download = page.waitForEvent("download");
  await link.click();
  expect((await download).suggestedFilename()).toBe("CREAR-PC-borrador.pdf");
  await page.getByRole("link", { name: "Volver al configurador", exact: true }).click();
  await expect(page.locator(".selected-parts > li")).toHaveCount(8);
});

test("las marcas están presentes en catálogo, ampliación y ficha", async ({ page }) => {
  await page.goto("/catalog");
  await expect(page.locator(".component-card__brand")).toHaveCount(8);
  const cpu = page.locator(".component-card").filter({ hasText: "AMD Ryzen 5 9600X" });
  await cpu.locator(".zoom-trigger").click();
  await expect(page.getByRole("dialog").locator(".preview-brand")).toBeVisible();
  await page.keyboard.press("Escape");
  await cpu.getByRole("link", { name: "AMD Ryzen 5 9600X", exact: true }).click();
  await expect(page.locator(".product-detail > div > .preview-brand")).toBeVisible();
});
