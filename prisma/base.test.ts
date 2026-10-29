import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { hash } from "bcryptjs";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import type { Server } from "node:net";
import { createReviewDatabaseServer } from "../scripts/lib/pglite-review-wire.mjs";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { seedBase } from "./seed";
let pg: PGlite;
let server: Server;
let client: PrismaClient;
const context = vi.hoisted(() => ({ client: null as PrismaClient | null }));
vi.mock("@/lib/prisma", () => ({
  prisma: new Proxy(
    {},
    {
      get: (_target, key) => {
        const db = context.client!;
        const value = Reflect.get(db, key);
        return typeof value === "function" ? value.bind(db) : value;
      },
    },
  ),
}));
import { authenticateCredentials } from "../lib/auth-credentials";
beforeAll(async () => {
  pg = new PGlite();
  for (const migration of ["20261028000000_legacy", "20261029000100_admin_base"])
    await pg.exec(await readFile(`prisma/migrations/${migration}/migration.sql`, "utf8"));
  server = await createReviewDatabaseServer(pg, 0);
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No se inició PostgreSQL de prueba");
  client = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: `postgresql://postgres:postgres@127.0.0.1:${address.port}/postgres`,
      max: 1,
    }),
  });
  context.client = client;
  await seedBase(client);
}, 60000);
afterAll(async () => {
  await client?.$disconnect();
  await new Promise<void>((resolve) => server?.close(() => resolve()));
  await pg?.close();
});
describe("Base Prisma ElitePC", () => {
  it("migra y ejecuta la semilla dos veces sin duplicar ni inventar productos", async () => {
    await seedBase(client);
    expect(await client.categoria.count()).toBe(7);
    expect(await client.sucursal.count()).toBe(6);
    expect(await client.producto.count()).toBe(0);
    expect((await client.usuario.findUniqueOrThrow({ where: { id: "sistema" } })).activo).toBe(
      false,
    );
    expect(
      (await client.categoria.findUniqueOrThrow({ where: { slug: "notebook" } })).specsSugeridas,
    ).toEqual(expect.arrayContaining([expect.objectContaining({ campo: "Memoria RAM" })]));
  });
  it("preserva tablas de proformas y exige unicidad del SKU", async () => {
    const tables = await pg.query<{ name: string }>(
      "SELECT tablename AS name FROM pg_tables WHERE schemaname='public'",
    );
    expect(tables.rows.map((row) => row.name)).toContain("proformas");
    const category = await client.categoria.findUniqueOrThrow({ where: { slug: "monitor" } });
    const product = await client.producto.create({
      data: {
        sku: "Z1234",
        slug: "prueba-monitor",
        titulo: "Monitor de prueba",
        categoriaId: category.id,
        orden: "a0",
        creadoPorId: "sistema",
        precioSinFactura: 548000,
      },
    });
    expect(product.precioSinFactura).toBe(548000);
    await expect(
      client.producto.create({
        data: {
          sku: "Z1234",
          slug: "otro-monitor",
          titulo: "Otro monitor",
          categoriaId: category.id,
          orden: "a1",
          creadoPorId: "sistema",
        },
      }),
    ).rejects.toMatchObject({ code: "P2002" });
    await client.producto.delete({ where: { id: product.id } });
  });
  it("bloquea cinco intentos fallidos, audita y permite volver tras 15 minutos", async () => {
    const email = "operador@fixture.invalid";
    const user = await client.usuario.create({
      data: {
        email,
        nombre: "Operador",
        rol: "EDITOR",
        passwordHash: await hash("clave-exclusiva-fixture", 4),
      },
    });
    for (let i = 0; i < 5; i++)
      expect(await authenticateCredentials({ email, password: "incorrecta" })).toBeNull();
    const blocked = await client.usuario.findUniqueOrThrow({ where: { id: user.id } });
    expect(blocked.intentosFallidos).toBe(5);
    expect(blocked.bloqueadoHasta!.getTime()).toBeGreaterThan(Date.now() + 14 * 60000);
    expect(
      await authenticateCredentials({ email, password: "clave-exclusiva-fixture" }),
    ).toBeNull();
    await client.usuario.update({
      where: { id: user.id },
      data: { bloqueadoHasta: new Date(Date.now() - 1000) },
    });
    expect(
      await authenticateCredentials({ email, password: "clave-exclusiva-fixture" }),
    ).toMatchObject({ id: user.id, rol: "EDITOR" });
    expect(
      (await client.usuario.findUniqueOrThrow({ where: { id: user.id } })).intentosFallidos,
    ).toBe(0);
    expect(
      await client.auditoria.count({ where: { usuarioId: user.id, accion: "login_fallido" } }),
    ).toBe(5);
    expect(await client.auditoria.count({ where: { usuarioId: user.id, accion: "login" } })).toBe(
      1,
    );
  });
});
describe("Migración del acceso anterior", () => {
  it("vincula un solo ADMIN con la contraseña existente y rechaza altas posteriores", async () => {
    vi.stubEnv("ADMIN_PASSWORD", "clave-inicial-solo-fixture-2026");
    expect(
      await authenticateCredentials(
        { email: "intruso@fixture.invalid", password: "incorrecta" },
        "203.0.113.1",
      ),
    ).toBeNull();
    const owner = await authenticateCredentials(
      { email: "dueno@fixture.invalid", password: "clave-inicial-solo-fixture-2026" },
      "203.0.113.2",
    );
    expect(owner?.rol).toBe("ADMIN");
    expect(
      await authenticateCredentials(
        { email: "otro@fixture.invalid", password: "clave-inicial-solo-fixture-2026" },
        "203.0.113.3",
      ),
    ).toBeNull();
    expect(await client.usuario.count({ where: { rol: "ADMIN", activo: true } })).toBe(1);
  }, 20000);
});
