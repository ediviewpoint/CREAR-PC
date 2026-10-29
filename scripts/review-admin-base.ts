// Isolated PostgreSQL and real browser review. Never connects to DATABASE_URL from .env.local.
import { PGlite } from "@electric-sql/pglite";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createReviewDatabaseServer } from "./lib/pglite-review-wire.mjs";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { chromium, expect } from "@playwright/test";
import { hash } from "bcryptjs";
import { seedBase } from "../prisma/seed";
import assert from "node:assert/strict";
import { generateNKeysBetween } from "fractional-indexing";
import { ExtraccionSchema } from "../lib/ia/schemas";
import { normalizeExtraction } from "../lib/ia/normalizar";
async function main() {
  const pg = new PGlite();
  for (const migration of ["20261028000000_legacy", "20261029000100_admin_base"])
    await pg.exec(await readFile(`prisma/migrations/${migration}/migration.sql`, "utf8"));
  const server = await createReviewDatabaseServer(pg, 0);
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("No se pudo iniciar la base aislada");
  const url = `postgresql://postgres:postgres@127.0.0.1:${address.port}/postgres`;
  const client = new PrismaClient({ adapter: new PrismaPg({ connectionString: url, max: 1 }) });
  await seedBase(client);
  const productsReview = process.argv.includes("--productos");
  if (productsReview) {
    const category = await client.categoria.findUniqueOrThrow({ where: { slug: "monitor" } });
    const orders = generateNKeysBetween(null, null, 2000);
    await client.producto.createMany({
      data: Array.from({ length: 2000 }, (_, i) => ({
        id: `review-${i}`,
        sku: `Z${1000 + i}`,
        slug: `monitor-${i}`,
        titulo: `Monitor ElitePC ${i}`,
        categoriaId: category.id,
        creadoPorId: "sistema",
        orden: orders[i]!,
        precioSinFactura: i === 0 ? 548000 : 150000 + i,
        disponibilidad: i === 2 ? ("SIN_STOCK" as const) : ("EN_STOCK" as const),
        requiereRevision: i === 4,
      })),
    });
  }
  const password = randomBytes(24).toString("base64url");
  await client.usuario.create({
    data: {
      email: "admin@fixture.invalid",
      nombre: "Revisión ElitePC",
      rol: "ADMIN",
      passwordHash: await hash(password, 4),
    },
  });
  await client.usuario.create({
    data: {
      email: "lector@fixture.invalid",
      nombre: "Lector",
      rol: "LECTOR",
      passwordHash: await hash(password, 4),
    },
  });
  const base = "http://127.0.0.1:3034";
  const originalNextEnv = await readFile("next-env.d.ts", "utf8");
  const child = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "dev",
      "--webpack",
      "--hostname",
      "127.0.0.1",
      "--port",
      "3034",
    ],
    {
      env: {
        ...process.env,
        DATABASE_URL: url,
        AUTH_SECRET: randomBytes(32).toString("hex"),
        AUTH_URL: base,
        TIPO_CAMBIO_URL: "",
        CREARPC_PREVIEW: "1",
      },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    },
  );
  let logs = "";
  child.stdout?.on("data", (chunk) => {
    logs = (logs + chunk).slice(-15000);
  });
  child.stderr?.on("data", (chunk) => {
    logs = (logs + chunk).slice(-15000);
  });
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  try {
    await mkdir("output/admin-base", { recursive: true });
    browser = await chromium.launch();
    console.log("Revisión fase 1: iniciando Next.js con PostgreSQL aislado.");
    const deadline = Date.now() + 180000;
    while (true) {
      try {
        const response = await fetch(`${base}/admin/login`, { signal: AbortSignal.timeout(10000) });
        if (response.ok) break;
      } catch {}
      if (Date.now() > deadline || child.exitCode !== null)
        throw new Error("Next.js no inició correctamente");
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.goto(`${base}/admin`);
    await page.waitForURL("**/admin/login");
    await page.getByLabel("Correo electrónico").fill("admin@fixture.invalid");
    await page.getByLabel("Contraseña", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Ingresar", exact: true }).click();
    await page.waitForURL("**/admin", { timeout: 60000 });
    await page.getByRole("heading", { name: "Inicio", exact: true }).waitFor();
    console.log("Acceso de ADMIN y dashboard verificados.");
    if (process.argv.includes("--batch")) {
      await page.goto(`${base}/admin/batch-ia?entrada=archivo`);
      await page
        .locator('input[type="file"]')
        .first()
        .setInputFiles({
          name: "inventario.csv",
          mimeType: "text/csv",
          buffer: Buffer.from(
            "SKU,Titulo,Marca,Modelo,Categoria,Precio BOB\nZ5000,Notebook HP prueba,HP,14-DQ6104DX,NOTEBOOK,5480\nZ5001,Notebook Dell prueba,Dell,3530,NOTEBOOK,6000",
          ),
        });
      await page.getByRole("button", { name: "Continuar con 2 filas", exact: true }).click();
      await page.getByRole("button", { name: "4. Pasar a revisión", exact: true }).click();
      await page
        .getByRole("checkbox", { name: "Seleccionar todas las propuestas", exact: true })
        .check();
      await page.getByRole("button", { name: "Guardar seleccionados", exact: true }).click();
      await expect
        .poll(() => client.producto.count({ where: { sku: { in: ["Z5000", "Z5001"] } } }), {
          timeout: 20000,
        })
        .toBe(2);
      assert.equal(
        (await client.producto.findUniqueOrThrow({ where: { sku: "Z5000" } })).precioSinFactura,
        548000,
      );
      console.log("Importación CSV verificada: mapeo, bandeja y guardado por SKU sin duplicar.");
      await page.goto(`${base}/admin`);
    }
    if (process.argv.includes("--ia")) {
      const fixture = JSON.parse(
        await readFile("tests/fixtures/extraccion/01-ejemplo.json", "utf8"),
      );
      const text = await readFile("tests/fixtures/extraccion/01-ejemplo.txt", "utf8");
      const categories = await client.categoria.findMany();
      const proposed = normalizeExtraction(
        ExtraccionSchema.parse(fixture.response),
        categories,
        [],
        6.96,
        true,
        text,
      );
      await page.route("**/api/ia/extraer", (route) =>
        route.fulfill({
          status: 200,
          contentType: "text/event-stream",
          body: `event: etapa\ndata: {"texto":"Ordenando specs"}\n\nevent: resultado\ndata: ${JSON.stringify({ ...proposed, posiblesDuplicados: [], usoIA: { tokensIn: 1, tokensOut: 1, ms: 1 } })}\n\n`,
        }),
      );
      await page.goto(`${base}/admin/productos/nuevo`);
      await page.getByRole("textbox", { name: "Texto para extraer con IA" }).fill(text);
      await page.getByRole("button", { name: "Extraer con IA", exact: true }).click();
      await expect(page.getByLabel("Modelo", { exact: true })).toHaveValue("14-DQ6104DX");
      await expect(page.getByLabel("SKU / Código", { exact: true })).toHaveValue("Z2766");
      assert.equal(await client.producto.count({ where: { sku: "Z2766" } }), 0);
      await page.getByRole("button", { name: "Guardar", exact: true }).click();
      await page.waitForURL(
        (url) =>
          /^\/admin\/productos\/[^/]+$/.test(url.pathname) && !url.pathname.endsWith("/nuevo"),
        { timeout: 60000 },
      );
      const product = await client.producto.findUniqueOrThrow({
        where: { sku: "Z2766" },
        include: { specs: true },
      });
      assert.equal(product.precioSinFactura, 548000);
      assert.ok(product.specs.length >= 5);
      console.log(
        "IA simulada de punta a punta: extracción, revisión sin guardado automático, guardado real y specs persistidas.",
      );
      await page.goto(`${base}/admin`);
    }
    if (process.argv.includes("--formulario")) {
      await page.goto(`${base}/admin/productos/nuevo`);
      await page.getByLabel("Marca", { exact: true }).fill("HP");
      await page.getByRole("textbox", { name: "Modelo", exact: true }).fill("14-DQ6104DX");
      await page.getByRole("textbox", { name: "SKU / Código", exact: true }).fill("Z2766");
      await page
        .getByRole("combobox", { name: "Categoría", exact: true })
        .selectOption({ label: "NOTEBOOK" });
      await page.getByRole("textbox", { name: "Sin factura (S/F)", exact: true }).fill("5480");
      await page.keyboard.press("Tab");
      await page
        .getByRole("textbox", { name: "Valor técnico 1", exact: true })
        .fill("Intel Celeron N150");
      await page.getByRole("button", { name: "Guardar", exact: true }).click();
      await page.waitForURL(
        (url) =>
          /^\/admin\/productos\/[^/]+$/.test(url.pathname) && !url.pathname.endsWith("/nuevo"),
        { timeout: 60000 },
      );
      await page.getByText("Producto guardado", { exact: false }).first().waitFor();
      const product = await client.producto.findUniqueOrThrow({ where: { sku: "Z2766" } });
      assert.equal(product.precioSinFactura, 548000);
      await page.getByRole("textbox", { name: "Color", exact: true }).fill("Plata");
      await page.getByRole("button", { name: "Guardar", exact: true }).click();
      await expect
        .poll(async () => client.productoHistorial.count({ where: { productoId: product.id } }))
        .toBe(2);
      console.log("Formulario verificado: crear, editar, centavos e historial real.");
      await page.goto(`${base}/admin`);
    }
    assert.equal(await page.locator(".elite-stat").count(), 4);
    assert.equal(
      await page.getByRole("combobox", { name: "Sucursal" }).locator("option").count(),
      7,
    );
    const rate = await page.request.get(`${base}/api/tipo-cambio`);
    assert.equal(rate.status(), 200);
    assert.equal((await rate.json()).aviso, true);
    await page.getByRole("button", { name: "Activar tema claro" }).click();
    assert.equal(await page.locator(".elite-admin").getAttribute("data-theme"), "light");
    await page.reload();
    await page.getByRole("button", { name: "Activar tema oscuro" }).waitFor();
    await page.getByRole("button", { name: "Alternar menú principal" }).click();
    assert.ok(
      await page
        .locator(".elite-admin")
        .evaluate((element) => element.classList.contains("sidebar-collapsed")),
    );
    await page.keyboard.press("Control+k");
    await page.getByRole("dialog").waitFor();
    await page.keyboard.press("Escape");
    await page.getByRole("link", { name: "Configuración", exact: true }).click();
    await page.getByRole("heading", { name: "Configuración", exact: true }).waitFor();
    if (productsReview) {
      await page.getByRole("link", { name: "Productos", exact: true }).click();
      await page.getByRole("heading", { name: "Productos", exact: true }).waitFor();
      await page.getByText("2.000 Productos", { exact: true }).waitFor();
      assert.equal(await page.locator(".elite-products-table tbody tr").count(), 50);
      const search = page.getByRole("textbox", { name: "Buscar productos", exact: true });
      await search.fill("5.480");
      await page.waitForURL("**/admin/productos?q=5.480");
      await page.getByText("1 Productos", { exact: true }).waitFor();
      await page.getByRole("button", { name: "Bs5.480,00", exact: true }).dblclick();
      const price = page.getByRole("textbox", { name: "Precio S/F de Z1000" });
      await price.fill("5500");
      await price.press("Enter");
      await page.getByText("Cambios guardados", { exact: true }).waitFor();
      assert.equal(
        (await client.producto.findUniqueOrThrow({ where: { id: "review-0" } })).precioSinFactura,
        550000,
      );
      await page.getByRole("link", { name: "Limpiar filtros", exact: true }).first().click();
      await page.getByText("2.000 Productos", { exact: true }).waitFor();
      await page.getByRole("checkbox", { name: "Seleccionar Z1000", exact: true }).check();
      await page.getByRole("combobox", { name: "Acciones masivas" }).selectOption("esconder");
      await Promise.all([
        page.waitForResponse(
          (response) =>
            response.url().endsWith("/api/productos/bulk") &&
            response.request().method() === "POST",
        ),
        page.getByRole("button", { name: "Aplicar", exact: true }).click(),
      ]);
      await page.getByText("Cambios guardados", { exact: true }).waitFor();
      assert.equal(
        (await client.producto.findUniqueOrThrow({ where: { id: "review-0" } })).escondido,
        true,
      );
      const previousOrder = (await client.producto.findUniqueOrThrow({ where: { id: "review-1" } }))
        .orden;
      const handle = page.getByRole("button", { name: "Reordenar Z1001", exact: true });
      await expect(handle).toBeEnabled();
      await handle.scrollIntoViewIfNeeded();
      await handle.focus();
      await page.keyboard.press("Space");
      await expect(handle).toHaveAttribute("aria-pressed", "true");
      await page.keyboard.press("ArrowDown");
      await page.waitForTimeout(150);
      await Promise.all([
        page.waitForResponse(
          (response) =>
            response.url().endsWith("/api/productos/reorder") &&
            response.request().method() === "PATCH",
        ),
        page.keyboard.press("Space"),
      ]);
      assert.notEqual(
        (await client.producto.findUniqueOrThrow({ where: { id: "review-1" } })).orden,
        previousOrder,
      );
      await page.screenshot({ path: "output/admin-base/listado-escritorio.png", fullPage: true });
      await page.getByRole("button", { name: "Columnas", exact: true }).click();
      await Promise.all([
        page.waitForResponse(
          (response) =>
            response.url().endsWith("/api/admin/preferencias") &&
            response.request().method() === "PATCH",
        ),
        page.getByRole("menuitemcheckbox", { name: /Precio C\/F/ }).click(),
      ]);
      await page.keyboard.press("Escape");
      await page.reload();
      await page.getByRole("columnheader", { name: "Precio C/F", exact: true }).waitFor();
      await page.getByRole("button", { name: /Administrar Categorías/ }).click();
      await page.getByRole("button", { name: "Editar categorías", exact: true }).click();
      await page.getByRole("textbox", { name: "Nueva categoría", exact: true }).fill("PRUEBA");
      await Promise.all([
        page.waitForResponse(
          (response) =>
            response.url().endsWith("/api/categorias") && response.request().method() === "POST",
        ),
        page.getByRole("dialog").getByRole("button", { name: "Guardar", exact: true }).click(),
      ]);
      await page.getByRole("button", { name: "Renombrar PRUEBA", exact: true }).waitFor();
      assert.equal(
        (await client.categoria.findFirstOrThrow({ where: { nombre: "PRUEBA" } })).padreId,
        null,
      );
      await page.getByRole("button", { name: "Renombrar PRUEBA", exact: true }).click();
      await page
        .getByRole("textbox", { name: "Renombrar categoría", exact: true })
        .fill("PRUEBA RENOMBRADA");
      await Promise.all([
        page.waitForResponse(
          (response) =>
            response.url().includes("/api/categorias/") && response.request().method() === "PUT",
        ),
        page.getByRole("dialog").getByRole("button", { name: "Guardar", exact: true }).click(),
      ]);
      await page.getByRole("button", { name: "Cerrar categorías", exact: true }).click();
      await page.getByRole("button", { name: "Activar tema oscuro", exact: true }).click();
      await page.setViewportSize({ width: 390, height: 844 });
      await page.locator(".elite-mobile-products article").first().waitFor();
      const card = page.locator(".elite-mobile-products article").first();
      await card.scrollIntoViewIfNeeded();
      const box = await card.boundingBox();
      assert.ok(box);
      await page.mouse.move(box.x + 55, box.y + 30);
      await page.mouse.down();
      await page.waitForTimeout(650);
      await page.mouse.up();
      assert.equal(await card.locator('input[type="checkbox"]').isChecked(), true);
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      );
      await page.screenshot({ path: "output/admin-base/listado-movil.png", fullPage: false });
      await page.setViewportSize({ width: 1440, height: 1000 });
      console.log(
        "Listado verificado: 2.000 productos, búsqueda numérica, precio rápido e historial, selección y acción masiva.",
      );
    }
    if (process.argv.includes("--integraciones")) {
      for (const [path, title] of [
        ["configuracion", "Configuración"],
        ["wordpress", "WordPress"],
        ["categorias", "Categorías"],
        ["etiquetas", "Etiquetas"],
        ["tickets", "Productos para tickets"],
        ["cotizacion", "Cotización"],
      ]) {
        await page.goto(`${base}/admin/${path}`);
        await page.getByRole("heading", { name: title!, exact: true }).waitFor();
      }
      const response = await page.request.post(`${base}/api/productos`, {
        data: {
          sku: "Z9999",
          titulo: "Ficha para cotización",
          estado: "borrador",
          precioSinFactura: 548000,
          precioConFactura: 636000,
        },
      });
      assert.ok(response.ok(), await response.text());
      const product = await response.json();
      const added = await page.request.post(`${base}/api/cotizaciones`, {
        data: { accion: "agregar", ids: [product.id] },
      });
      assert.ok(added.ok(), await added.text());
      const quote = await added.json();
      const pdf = await page.request.get(`${base}/api/cotizaciones/${quote.id}/pdf`);
      assert.equal(pdf.status(), 200);
      assert.equal((await pdf.body()).subarray(0, 4).toString(), "%PDF");
      await page.goto(`${base}/admin/cotizacion`);
      await page.getByText("Z9999 Ficha para cotización").waitFor();
      await page.goto(`${base}/productos`);
      assert.equal(await page.getByText("Ficha para cotización", { exact: true }).count(), 0);
      await page.goto(`${base}/admin`);
      console.log(
        "Integraciones verificadas: configuración, roles, categorías, etiquetas, tickets, cotización, PDF y borradores fuera del catálogo público.",
      );
    }
    await mkdir("output/admin-base", { recursive: true });
    await page.screenshot({ path: "output/admin-base/escritorio.png", fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "Alternar menú principal" }).click();
    await page.getByRole("dialog").getByRole("link", { name: "Inicio", exact: true }).click();
    await page.getByRole("heading", { name: "Inicio", exact: true }).waitFor();
    assert.equal(await page.getByRole("dialog").count(), 0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    await page.screenshot({ path: "output/admin-base/movil.png", fullPage: true });
    const reader = await browser.newPage();
    await reader.goto(`${base}/admin/login`);
    await reader.getByLabel("Correo electrónico").fill("lector@fixture.invalid");
    await reader.getByLabel("Contraseña", { exact: true }).fill(password);
    await reader.getByRole("button", { name: "Ingresar", exact: true }).click();
    await reader.waitForURL("**/admin");
    assert.equal(await reader.getByRole("link", { name: "Configuración", exact: true }).count(), 0);
    assert.equal((await reader.request.get(`${base}/api/admin/product-template`)).status(), 401);
    if (productsReview) {
      const denied = await reader.request.patch(`${base}/api/productos/review-0`, {
        data: { updatedAt: new Date().toISOString(), precioSinFactura: 1 },
      });
      assert.equal(denied.status(), 403);
      const anonymous = await browser.newContext();
      assert.equal((await anonymous.request.get(`${base}/api/productos`)).status(), 401);
      await anonymous.close();
    }
    console.log(
      "Fase 1 verificada: sesión, permisos, dashboard, TC de respaldo, tema persistente, menú y drawer móvil.",
    );
  } catch (error) {
    console.error(logs.replaceAll(password, "[oculto]"));
    throw error;
  } finally {
    await browser?.close();
    if (process.platform === "win32" && child.pid)
      await new Promise<void>((resolve) => {
        const stop = spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
          windowsHide: true,
          stdio: "ignore",
        });
        stop.on("exit", () => resolve());
      });
    else child.kill("SIGTERM");
    await writeFile("next-env.d.ts", originalNextEnv);
    await client.$disconnect();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await pg.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
