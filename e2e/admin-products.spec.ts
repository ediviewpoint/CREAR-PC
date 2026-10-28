import { expect, test, type BrowserContext } from "@playwright/test";
import { readFile } from "node:fs/promises";
import sharp from "sharp";

test.skip(!process.env.ADMIN_E2E, "Requiere scripts/admin-review-server.mjs y su base aislada");
test.use({ actionTimeout: 10000, navigationTimeout: 15000 });
let adminCookies: Awaited<ReturnType<BrowserContext["cookies"]>>;
test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${process.env.PLAYWRIGHT_BASE_URL}/admin/login`);
  await page.locator('[name="password"]').fill("local-admin-review-only-2026");
  await page.getByRole("button", { name: "Ingresar", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  adminCookies = await context.cookies();
  await context.close();
});
test.beforeEach(async ({ context }) => {
  await context.addCookies(adminCookies);
});

test("entrar desde la web, navegar por el panel y cerrar sesión", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.goto(`${process.env.PLAYWRIGHT_BASE_URL}/`);
    await expect(
      page.locator("footer").getByRole("link", { name: "Administración", exact: true }),
    ).toHaveAttribute("href", "/admin");
    await page
      .getByRole("navigation", { name: "Principal", exact: true })
      .getByRole("link", { name: "Administración", exact: true })
      .click();
    await expect(page).toHaveURL(/\/admin\/login$/);
    await page
      .getByLabel("Contraseña de administración", { exact: true })
      .fill("local-admin-review-only-2026");
    await page.getByRole("button", { name: "Mostrar", exact: true }).click();
    await expect(page.locator('[name="password"]')).toHaveAttribute("type", "text");
    await page.getByRole("button", { name: "Ocultar", exact: true }).click();
    await expect(page.locator('[name="password"]')).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: "Ingresar", exact: true }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await page.getByRole("link", { name: "Añadir producto +", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/componentes\/nuevo$/);
    const nav = page.getByRole("navigation", { name: "Administración", exact: true });
    await expect(nav.getByRole("link", { name: "Productos", exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await page.getByRole("link", { name: "Volver a la web", exact: false }).click();
    await expect(page).toHaveURL(`${process.env.PLAYWRIGHT_BASE_URL}/`);
    await page
      .getByRole("navigation", { name: "Principal", exact: true })
      .getByRole("link", { name: "Administración", exact: true })
      .click();
    await expect(page).toHaveURL(/\/admin$/);
    await page.goto(`${process.env.PLAYWRIGHT_BASE_URL}/admin/login`);
    await expect(page).toHaveURL(/\/admin$/);
    await page.getByRole("button", { name: "Cerrar sesión", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/login$/);
    await page.goto(`${process.env.PLAYWRIGHT_BASE_URL}/admin/componentes`);
    await expect(page).toHaveURL(/\/admin\/login$/);
    for (const width of [320, 375]) {
      await page.setViewportSize({ width, height: 812 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
  } finally {
    await context.close();
  }
});

test("crear con precio y stock, editarlo y retirar el precio desde la ficha", async ({ page }) => {
  await page.goto("/admin/componentes/nuevo");
  const form = page.locator("form.product-editor");
  const name = `Precio propio QA ${Date.now()}`;
  await form.locator('[name="name"]').fill(name);
  await form.locator('[name="brand"]').fill("Kingston");
  await form.locator('[name="category"]').selectOption("ram");
  await form.getByRole("radio", { name: "Con precio", exact: true }).check();
  if (await form.locator('[name="ownStoreName"]').count()) {
    await form.locator('[name="ownStoreName"]').fill("Tienda propia de revisión");
    await form.locator('[name="ownStoreCity"]').fill("Ciudad de prueba");
  }
  await form.locator('[name="priceAmount"]').fill("850.00");
  await form.locator('[name="priceStockQty"]').fill("4");
  await form.locator('[name="isActive"]').check();
  await form.getByRole("button", { name: "Guardar borrador", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/componentes\/[0-9a-f-]{36}$/);
  await expect(form.locator('[name="isActive"]')).not.toBeChecked();
  await expect(form.locator('[name="priceAmount"]')).toHaveValue("850.00");
  await expect(form.locator('[name="priceStockQty"]')).toHaveValue("4");
  await page.reload();
  await expect(form.locator('[name="priceAmount"]')).toHaveValue("850.00");
  await form.locator('[name="priceAmount"]').fill("900.50");
  await form.getByRole("button", { name: "Guardar borrador", exact: true }).click();
  await expect(form.getByRole("status")).toContainText("Borrador guardado");
  await page.reload();
  await expect(form.locator('[name="priceAmount"]')).toHaveValue("900.50");
  await form.getByRole("radio", { name: "Por cotizar", exact: true }).check();
  await form.getByRole("button", { name: "Guardar borrador", exact: true }).click();
  await expect(form.getByRole("status")).toContainText("Borrador guardado");
  await page.reload();
  await expect(form.getByRole("radio", { name: "Por cotizar", exact: true })).toBeChecked();
  await page.setViewportSize({ width: 375, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("galería, foto principal y duplicación sin publicar la copia", async ({ page }) => {
  await page.goto("/admin/componentes/nuevo");
  const form = page.locator("form.product-editor");
  const name = `Galeria QA ${Date.now()}`;
  await form.locator('[name="name"]').fill(name);
  await form.locator('[name="brand"]').fill("Kingston");
  await form.locator('[name="category"]').selectOption("ram");
  const photos = await Promise.all(
    ["#dd3333", "#33dd33", "#3333dd"].map(async (background, index) => ({
      name: `vista-${index}.png`,
      mimeType: "image/png",
      buffer: await sharp({ create: { width: 120, height: 90, channels: 3, background } })
        .png()
        .toBuffer(),
    })),
  );
  await form.locator('[name="galleryPhotos"]').setInputFiles(photos);
  await form.getByRole("button", { name: "Guardar borrador", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/componentes\/[0-9a-f-]{36}$/);
  const editUrl = page.url();
  const gallery = form.locator(".product-gallery-editor");
  await expect(gallery.locator("img")).toHaveCount(3);
  const second = await gallery.locator("img").nth(1).getAttribute("src");
  const secondId = second!.split("/").at(-1)!;
  await form.locator('[name="primaryPhoto"]').selectOption(secondId);
  await gallery.getByRole("textbox").nth(1).fill("Vista lateral verificada");
  await form.getByRole("button", { name: "Guardar borrador", exact: true }).click();
  await expect(form.getByRole("status")).toContainText("Borrador guardado");
  await expect(form.locator(".product-photo-preview img")).toHaveAttribute("src", second!);
  await expect(gallery.getByRole("textbox").first()).toHaveValue("Vista lateral verificada");
  await gallery.locator('[name="deletePhotos"]').first().check();
  await form.getByRole("button", { name: "Guardar borrador", exact: true }).click();
  await expect(gallery.locator("img")).toHaveCount(2);
  expect((await page.request.get(second!)).status()).toBe(404);
  await page.goto("/admin/componentes");
  await page.getByRole("button", { name: `Duplicar ${name}`, exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/componentes\/[0-9a-f-]{36}$/);
  expect(page.url()).not.toBe(editUrl);
  await expect(form.locator('[name="name"]')).toHaveValue(`${name} (copia)`);
  await expect(form.locator('[name="isActive"]')).not.toBeChecked();
  await expect(gallery.locator("img")).toHaveCount(0);
  await expect(form.locator('[name="brand"]')).toHaveValue("Kingston");
});

test("CSV con previsualización, borradores y rechazo de identificadores existentes", async ({
  page,
}) => {
  await page.goto("/admin/componentes/importar");
  const stamp = Date.now();
  const csv = Buffer.from(
    `\uFEFFnombre;marca;identificador;categoria\r\n"RAM; especial ${stamp}";Kingston;csv-a-${stamp};ram\r\nRAM segunda ${stamp};Kingston;csv-b-${stamp};ram\r\n`,
  );
  await page
    .locator('[name="csv"]')
    .setInputFiles({ name: "productos.csv", mimeType: "text/csv", buffer: csv });
  await page.getByRole("button", { name: "Validar y previsualizar" }).click();
  await expect(page.getByRole("status")).toContainText("2 productos válidos");
  await expect(
    page.getByRole("cell", { name: `RAM; especial ${stamp}`, exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Confirmar importación como borradores" }).click();
  await expect(page.getByRole("status")).toContainText("Se importaron 2 productos");
  await page.getByRole("button", { name: "Validar y previsualizar" }).click();
  await expect(page.locator('.product-editor__message[role="alert"]')).toContainText("ya existen");
  await expect(
    page.getByRole("button", { name: "Confirmar importación como borradores" }),
  ).toHaveCount(0);
  await page.goto("/admin/componentes");
  await page.getByRole("searchbox", { name: "Buscar producto" }).fill(String(stamp));
  const rows = page.getByRole("row").filter({ hasText: String(stamp) });
  await expect(rows).toHaveCount(2);
  await expect(rows.first()).toContainText("Borrador");
  await page.getByRole("combobox", { name: "Precio", exact: true }).selectOption("missing");
  await expect(rows).toHaveCount(2);
  await page.getByRole("combobox", { name: "Precio", exact: true }).selectOption("priced");
  await expect(rows).toHaveCount(0);
  await page.getByRole("button", { name: "Limpiar filtros", exact: true }).click();
  await expect(page.getByRole("searchbox", { name: "Buscar producto" })).toHaveValue("");
});

test("alta, foto, precio, publicación, edición y desactivación desde el panel", async ({
  page,
  browser,
}) => {
  test.setTimeout(120_000);
  await page.goto("/admin/componentes/nuevo");
  const form = page.locator("form.product-editor");
  const name = `ZZZ RAM revisión ${Date.now()}`;
  await form.locator('[name="name"]').fill(name);
  await form.locator('[name="brand"]').fill("Kingston");
  await form.locator('[name="category"]').selectOption("ram");
  await form.locator('[name="source"]').fill("https://fixture.invalid/ficha");
  const photo = await sharp({
    create: { width: 240, height: 180, channels: 3, background: "#84937b" },
  })
    .png()
    .toBuffer();
  await form
    .locator('[name="photo"]')
    .setInputFiles({ name: "revision.png", mimeType: "image/png", buffer: photo });
  await form.getByRole("button", { name: "Guardar borrador", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/componentes\/[0-9a-f-]{36}$/);
  const editUrl = page.url();
  const slug = await form.locator('[name="slug"]').inputValue();
  await expect(form.locator('[name="name"]')).toHaveValue(name);
  const image = await form.locator(".product-photo-preview img").getAttribute("src");
  expect(image).toMatch(/^\/api\/product-images\//);
  expect(await page.evaluate(async (url) => (await fetch(url)).status, image!)).toBe(200);
  const anonymous = await browser.newContext();
  const publicPage = await anonymous.newPage();
  expect((await publicPage.request.get(new URL(image!, editUrl).href)).status()).toBe(404);
  await publicPage.goto(new URL("/catalog", editUrl).href);
  await expect(publicPage.getByText(name, { exact: true })).toHaveCount(0);

  const rows = JSON.parse(await readFile("data/seed/ram.json", "utf8"));
  const spec = rows.find(
    (row: { slug: string }) => row.slug === "kingston-fury-beast-ddr5-2x16gb-5600",
  ).spec;
  for (const [key, value] of Object.entries(spec)) {
    const input = form.locator(`[name="spec.${key}"]`);
    if ((await input.evaluate((element) => element.tagName)) === "SELECT")
      await input.selectOption(String(value));
    else await input.fill(String(value));
  }
  await form.locator('[name="isActive"]').check();
  await form.getByRole("radio", { name: "Con precio", exact: true }).check();
  if (await form.locator('[name="ownStoreName"]').count()) {
    await form.locator('[name="ownStoreName"]').fill("Tienda propia de revisión");
    await form.locator('[name="ownStoreCity"]').fill("Ciudad de prueba");
  }
  await form.locator('[name="priceAmount"]').fill("123.45");
  await form.locator('[name="priceStockQty"]').fill("4");
  await form.getByRole("button", { name: "Guardar y publicar", exact: true }).click();
  await expect(form.getByRole("status")).toContainText("publicado");
  expect((await publicPage.request.get(new URL(image!, editUrl).href)).status()).toBe(200);
  await publicPage.reload();
  await expect(publicPage.getByRole("link", { name, exact: true })).toBeVisible();

  await expect(form.locator('[name="priceAmount"]')).toHaveValue("123.45");

  await page.goto("/build");
  await page.getByRole("button", { name: "Cargar equipo de prueba", exact: true }).click();
  await expect(page.locator(".selected-parts li")).toHaveCount(8);
  await page.goto(`/build?component=${slug}`);
  await expect(page.locator(".selected-parts")).toContainText(name);
  await page.getByRole("button", { name: "Generar proforma", exact: false }).click();
  await page
    .getByRole("dialog")
    .getByLabel("Nombre del cliente", { exact: true })
    .fill("Cliente de prueba aislada");
  await page.getByRole("button", { name: "Emitir proforma", exact: true }).click();
  await expect(page).toHaveURL(/\/proforma\/[0-9a-f-]{36}$/, { timeout: 20000 });
  const quoteUrl = page.url();
  const quoteId = quoteUrl.split("/").at(-1)!;
  await expect(page.locator("main")).toContainText(name);
  const pdf = await page.request.get(`/api/proforma/${quoteId}/pdf`);
  expect(pdf.status()).toBe(200);
  expect((await pdf.body()).subarray(0, 4).toString()).toBe("%PDF");

  await page.goto(editUrl);
  await page.setViewportSize({ width: 375, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: "output/review/admin-product-mobile.png", fullPage: true });
  await form.locator('[name="name"]').fill(`${name} editado`);
  await form.getByRole("button", { name: "Guardar y publicar", exact: true }).click();
  await expect(form.getByRole("status")).toContainText("publicado");
  await page.goto("/admin/componentes");
  const row = page.getByRole("row").filter({ hasText: `${name} editado` });
  await expect(row).toContainText("123");
  await row.getByRole("button", { name: `Desactivar ${name} editado`, exact: true }).click();
  await expect(row).toContainText("Borrador");
  await publicPage.reload();
  await expect(publicPage.getByText(`${name} editado`, { exact: true })).toHaveCount(0);
  await page.goto(quoteUrl);
  await expect(page.locator("main")).toContainText(name);
  await expect(page.locator("main")).not.toContainText(`${name} editado`);
  await page.goto("/admin/componentes");
  await row.getByRole("button", { name: `Publicar ${name} editado`, exact: true }).click();
  await expect(row).toContainText("Publicado");
  await anonymous.close();
});
