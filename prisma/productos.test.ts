import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import type { Server } from "node:net";
import { createReviewDatabaseServer } from "../scripts/lib/pglite-review-wire.mjs";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { seedBase } from "./seed";
import { generateNKeysBetween } from "fractional-indexing";
import { searchPriceCents } from "../lib/productos/query";
const context = vi.hoisted(() => ({
  client: null as PrismaClient | null,
  aiResponse: null as unknown,
  failOnce: false,
}));
vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = {
      create: async () => {
        const invalid = context.failOnce;
        context.failOnce = false;
        return {
          content: [
            {
              type: "tool_use",
              name: "emitir_resultado",
              input: invalid ? {} : context.aiResponse,
            },
          ],
          usage: { input_tokens: 10, output_tokens: 20 },
        };
      },
    };
  },
}));
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
import { listProducts } from "../lib/productos/listar";
import { quickPatch, reorderProduct, softDelete } from "../lib/productos/mutaciones";
import { bulkProducts } from "../lib/productos/bulk";
import { duplicateProduct } from "../lib/productos/duplicar";
import { saveProduct, getProduct } from "../lib/productos/guardar";
import { extractProduct } from "../lib/ia/extraer";
import { createBatch, nextBatch, getBatch, saveBatch } from "../lib/ia/batch";
import { suggestMapping, mappedRow } from "../lib/importacion";
let pg: PGlite;
let server: Server;
let client: PrismaClient;
let branch: string;
beforeAll(async () => {
  pg = new PGlite();
  for (const migration of ["20261028000000_legacy", "20261029000100_admin_base"])
    await pg.exec(await readFile(`prisma/migrations/${migration}/migration.sql`, "utf8"));
  server = await createReviewDatabaseServer(pg, 0);
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No inició PostgreSQL aislado");
  client = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: `postgresql://postgres:postgres@127.0.0.1:${address.port}/postgres`,
      max: 1,
    }),
  });
  context.client = client;
  await seedBase(client);
  const category = await client.categoria.findUniqueOrThrow({ where: { slug: "monitor" } });
  branch = (await client.sucursal.findFirstOrThrow()).id;
  const orders = generateNKeysBetween(null, null, 2000);
  await client.producto.createMany({
    data: Array.from({ length: 2000 }, (_, i) => ({
      id: `fixture-${i}`,
      sku: `Z${1000 + i}`,
      slug: `monitor-${i}`,
      titulo: `Monitor de prueba ${i}`,
      categoriaId: category.id,
      orden: orders[i]!,
      creadoPorId: "sistema",
      precioSinFactura: i === 0 ? 548000 : 100000 + i,
      costo: 90000,
      disponibilidad: i === 2 ? ("SIN_STOCK" as const) : ("EN_STOCK" as const),
      controlaInventario: i === 1,
      escondido: i === 3,
      requiereRevision: i === 4,
    })),
  });
  await client.stockSucursal.create({
    data: { productoId: "fixture-1", sucursalId: branch, cantidad: 2 },
  });
}, 60000);
afterAll(async () => {
  await client?.$disconnect();
  await new Promise<void>((resolve) => server?.close(() => resolve()));
  await pg?.close();
});
describe("Listado y edición rápida con PostgreSQL", () => {
  it("interpreta precios bolivianos y decimales sin multiplicarlos por error", () => {
    for (const value of ["5480", "5.480", "5.480,00", "5480.00", "Bs 5.480,00"])
      expect(searchPriceCents(value)).toBe(548000);
    expect(searchPriceCents("5,480.25")).toBe(548025);
    expect(searchPriceCents("no es precio")).toBeNull();
  });
  it("pagina 2.000 productos en menos de un segundo y no devuelve costos", async () => {
    await listProducts({});
    const start = performance.now();
    const result = await listProducts({});
    expect(performance.now() - start).toBeLessThan(1000);
    expect(result.total).toBe(2000);
    expect(result.items).toHaveLength(50);
    expect(result.items[0]?.id).toBe("fixture-0");
    expect(result.items[0]?.precioUsd).toBe(78736);
    expect(result.items[0]?.usdCalculado).toBe(true);
    expect(result.items[0]).not.toHaveProperty("costo");
    for (const q of ["5480", "5.480"]) {
      const found = await listProducts({ q });
      expect(found.items.map((v) => v.id)).toContain("fixture-0");
    }
  });
  it("filtra stock por sucursal, revisión, escondidos y texto seguro", async () => {
    const low = await listProducts({ disponibilidad: "STOCK_BAJO", sucursal: branch });
    expect(low.items.map((v) => v.id)).toEqual(["fixture-1"]);
    expect(low.items[0]?.stockTotal).toBe(2);
    expect((await listProducts({ revision: "true" })).items.map((v) => v.id)).toEqual([
      "fixture-4",
    ]);
    expect((await listProducts({ escondido: "true" })).items.map((v) => v.id)).toEqual([
      "fixture-3",
    ]);
    expect((await listProducts({ q: "' OR 1=1 --" })).total).toBe(0);
  });
  it("protege precio, detecta edición concurrente y registra historial", async () => {
    const current = await client.producto.findUniqueOrThrow({ where: { id: "fixture-0" } });
    const input = { updatedAt: current.updatedAt.toISOString(), precioSinFactura: 550000 };
    await expect(
      quickPatch(current.id, input, { id: "sistema", rol: "VENDEDOR" }),
    ).rejects.toMatchObject({ code: "SIN_PERMISO" });
    await quickPatch(current.id, input, { id: "sistema", rol: "EDITOR" });
    await expect(
      quickPatch(current.id, input, { id: "sistema", rol: "EDITOR" }),
    ).rejects.toMatchObject({ code: "CONFLICTO_VERSION" });
    expect(
      await client.productoHistorial.count({
        where: { productoId: current.id, accion: "precio_rapido" },
      }),
    ).toBe(1);
  });
  it("persiste arrastre fraccional y borra solo con ADMIN", async () => {
    await reorderProduct(
      { id: "fixture-10", antesDe: "fixture-0" },
      { id: "sistema", rol: "EDITOR" },
    );
    expect((await listProducts({})).items[0]?.id).toBe("fixture-10");
    await expect(softDelete("fixture-10", { id: "sistema", rol: "EDITOR" })).rejects.toMatchObject({
      code: "SIN_PERMISO",
    });
    await softDelete("fixture-10", { id: "sistema", rol: "ADMIN" });
    expect((await listProducts({})).total).toBe(1999);
    expect(
      (await client.producto.findUniqueOrThrow({ where: { id: "fixture-10" } })).deletedAt,
    ).not.toBeNull();
  });
  it("ejecuta acciones masivas con historial y revierte todo si un precio es inválido", async () => {
    const ids = ["fixture-0", "fixture-1"];
    await bulkProducts({ ids, accion: "esconder" }, { id: "sistema", rol: "EDITOR" });
    expect(await client.producto.count({ where: { id: { in: ids }, escondido: true } })).toBe(2);
    expect(
      await client.productoHistorial.count({
        where: { productoId: { in: ids }, origen: "masivo:esconder" },
      }),
    ).toBe(2);
    await expect(
      bulkProducts(
        {
          ids,
          accion: "ajustarPrecio",
          datos: { tipo: "monto", valor: -200000, redondear: false },
        },
        { id: "sistema", rol: "EDITOR" },
      ),
    ).rejects.toMatchObject({ code: "VALIDACION" });
    expect(
      (await client.producto.findUniqueOrThrow({ where: { id: "fixture-0" } })).precioSinFactura,
    ).toBe(550000);
    await bulkProducts(
      { ids, accion: "agregarEtiquetas", datos: { etiquetas: ["oficina", "OFICINA"] } },
      { id: "sistema", rol: "EDITOR" },
    );
    expect(await client.etiqueta.count({ where: { nombre: "OFICINA" } })).toBe(1);
    expect(await client.productoEtiqueta.count({ where: { productoId: { in: ids } } })).toBe(2);
  });
  it("duplica con nuevo SKU, sin publicar ni inventar existencias", async () => {
    const copy = await duplicateProduct("fixture-1", { id: "sistema", rol: "EDITOR" });
    expect(copy.sku).toBe("Z3000");
    const stored = await client.producto.findUniqueOrThrow({
      where: { id: copy.id },
      include: { stocks: true },
    });
    expect(stored.estado).toBe("borrador");
    expect(stored.disponibilidad).toBe("SIN_STOCK");
    expect(stored.stocks[0]?.cantidad).toBe(0);
    expect(
      await client.productoHistorial.count({ where: { productoId: copy.id, origen: "duplicar" } }),
    ).toBe(1);
  });
});
describe("Formulario completo", () => {
  it("crea, edita y audita el ejemplo sin permitir escritura al vendedor", async () => {
    const category = await client.categoria.findUniqueOrThrow({ where: { slug: "notebook" } });
    const input = {
      sku: "Z9000",
      titulo: 'HP CELERON N150 14" MOD: 14-DQ6104DX (DOSN8UA)',
      marca: "HP",
      modelo: "14-DQ6104DX",
      partNumber: "DOSN8UA",
      categoriaId: category.id,
      categoriaNombre: "NOTEBOOK",
      precioSinFactura: 548000,
      controlaInventario: true,
      stocks: [{ sucursalId: branch, cantidad: 1 }],
      specs: [
        { campo: "Procesador", valor: "Intel Celeron N150" },
        { campo: "Memoria RAM", valor: "4 GB" },
      ],
      descripcion: "<p>Notebook <strong>HP</strong></p><script>alert(1)</script>",
      destacados: [{ icono: "chip", texto: "Intel Celeron N150" }],
      puntosClave: [{ titulo: "Multitarea", descripcion: "Ofimática y navegación", enPdf: true }],
      costo: 400000,
    };
    await expect(saveProduct(input, { id: "sistema", rol: "VENDEDOR" })).rejects.toMatchObject({
      code: "SIN_PERMISO",
    });
    const created = await saveProduct(input, { id: "sistema", rol: "ADMIN" });
    expect(created.precioSinFactura).toBe(548000);
    expect(created.descripcion).not.toContain("script");
    const read = await getProduct(created.id, "EDITOR");
    expect(read).not.toHaveProperty("costo");
    const saved = await saveProduct(
      { ...read, color: "Plata", stocks: [{ sucursalId: branch, cantidad: 0 }] },
      { id: "sistema", rol: "EDITOR" },
      created.id,
    );
    expect(saved.disponibilidad).toBe("SIN_STOCK");
    expect(await client.productoHistorial.count({ where: { productoId: created.id } })).toBe(2);
    await expect(
      saveProduct({ ...read, color: "Azul" }, { id: "sistema", rol: "EDITOR" }, created.id),
    ).rejects.toMatchObject({ code: "CONFLICTO_VERSION" });
  });
  it("permite un borrador solo con SKU y título", async () => {
    const draft = await saveProduct(
      { sku: "Z9001", titulo: "Borrador nuevo", estado: "borrador" },
      { id: "sistema", rol: "EDITOR" },
    );
    expect(draft.estado).toBe("borrador");
    expect(draft.precioSinFactura).toBeNull();
  });
});
describe("Extracción IA en el servidor", () => {
  it("valida, reintenta, registra uso y detecta duplicados sin guardar la propuesta", async () => {
    vi.stubEnv("AI_API_KEY", "fixture-no-real-key");
    const fixture = JSON.parse(await readFile("tests/fixtures/extraccion/01-ejemplo.json", "utf8"));
    context.aiResponse = fixture.response;
    context.failOnce = true;
    // El catálogo de prueba ya contiene Z2766 entre sus 2.000 productos.
    const before = await client.producto.count();
    const output = await extractProduct(
      {
        texto: await readFile("tests/fixtures/extraccion/01-ejemplo.txt", "utf8"),
        opciones: { buscarModelo: false, generarDestacados: false, moneda: "Detectar" },
      },
      { id: "sistema", rol: "EDITOR" },
    );
    expect(output.producto.precioSinFactura).toBe(548000);
    expect(output.posiblesDuplicados.map((v) => v.sku)).toContain("Z2766");
    expect(await client.producto.count()).toBe(before);
    expect(await client.usoIA.findFirst({ where: { funcion: "extraer" } })).toMatchObject({
      ok: true,
      tokensIn: 20,
      tokensOut: 40,
    });
  });
});
describe("Batch e importación", () => {
  it("interpreta columnas USD/BOB y códigos sin cambiar la escala", () => {
    const mapping = suggestMapping(["Código", "Producto", "Precio BOB", "USD", "Stock"]);
    const row = mappedRow(
      { Código: "z9000", Producto: "Notebook HP", "Precio BOB": "5.480,00", USD: 785, Stock: 2 },
      mapping,
    );
    expect(row).toMatchObject({
      sku: "Z9000",
      precioSinFactura: 548000,
      precioUsd: 78500,
      stock: 2,
    });
  });
  it("procesa 20 propuestas, conserva el trabajo y guarda sin duplicar al reintentar", async () => {
    const user = await client.usuario.create({
      data: { nombre: "Batch fixture", email: "batch@fixture.invalid", rol: "EDITOR" },
    });
    const actor = { id: user.id, rol: "EDITOR" as const };
    const fixture = JSON.parse(await readFile("tests/fixtures/extraccion/01-ejemplo.json", "utf8"));
    context.aiResponse = fixture.response;
    const text = (await readFile("tests/fixtures/extraccion/01-ejemplo.txt", "utf8")).replace(
      /\n/g,
      " ",
    );
    const created = await createBatch(
      {
        tipoEntrada: "texto",
        contenido: Array(20).fill(text).join("\n"),
        opciones: {
          separar: "linea",
          generarDestacados: false,
          buscarModelo: false,
          moneda: "Detectar",
          margen: 0,
          separador: "",
        },
      },
      actor,
    );
    let job = await nextBatch(created.trabajoId, actor);
    expect(job.procesados).toBe(3);
    expect(await client.productoHistorial.count({ where: { usuarioId: user.id } })).toBe(0);
    while (job.procesados < 20) job = await nextBatch(job.id, actor);
    expect((await getBatch(job.id, actor)).total).toBe(20);
    const items = job.items as unknown as { id: string }[];
    const first = { items: items.slice(0, 2).map((v) => ({ id: v.id, accion: "crear" })) };
    const count = await client.producto.count();
    const saved = await saveBatch(job.id, first, actor);
    expect(saved.resultados.every((v) => v.estado === "guardado")).toBe(true);
    expect(await client.producto.count()).toBe(count + 2);
    await saveBatch(job.id, first, actor);
    expect(await client.producto.count()).toBe(count + 2);
  }, 30000);
});
