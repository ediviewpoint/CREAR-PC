// Isolated PostgreSQL and real browser review. Never connects to DATABASE_URL from .env.local.
import { PGlite } from "@electric-sql/pglite";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createReviewDatabaseServer } from "./lib/pglite-review-wire.mjs";
import { readFile, mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { chromium } from "@playwright/test";
import { hash } from "bcryptjs";
import { seedBase } from "../prisma/seed";
import assert from "node:assert/strict";
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
    await client.$disconnect();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await pg.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
