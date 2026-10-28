import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import { makeCompatibleBuild } from "@/lib/compat/__tests__/fixtures";
const context = vi.hoisted(() => ({ db: undefined as unknown, owner: "owner-a" }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", async () => ({
  getDb: () => context.db,
  schema: await import("@/lib/db/schema"),
}));
vi.mock("@/lib/auth/visitor", () => ({ visitorHash: async () => context.owner }));
import { listCatalogForUi } from "@/lib/db/repos/catalog";
import { saveOwnedBuild, issueOwnedQuote } from "@/lib/quote/service";
import { getPublicProforma, getAccessibleProforma } from "@/lib/proforma/load";
import { nextProformaCode, counterValue } from "@/lib/proforma/sequence";
const pg = new PGlite(),
  db = drizzle(pg, { schema });
let input: {
  name: string;
  items: { componentId: string; owned: boolean; quantity: number; offerId: string }[];
};
let built: string, requestKey: string, quoteId: string, firstCode: string;
beforeAll(async () => {
  context.db = db;
  process.env.DATABASE_URL ||= "postgresql://fixture.invalid/test";
  for (const file of (await readdir("drizzle")).filter((p) => p.endsWith(".sql")).sort())
    await pg.exec(await readFile(path.join("drizzle", file), "utf8"));
  const fixture = makeCompatibleBuild(),
    storeId = randomUUID();
  await db
    .insert(schema.stores)
    .values({ id: storeId, slug: "tienda-prueba-fixture", name: "Tienda de prueba", city: "Fixture" });
  const rows = [
    ["cpu", fixture.cpu],
    ["gpu", fixture.gpu],
    ["mobo", fixture.mobo],
    ["ram", fixture.ram[0]],
    ["storage", fixture.storage[0]],
    ["psu", fixture.psu],
    ["case", fixture.case],
    ["cooler_air", fixture.coolerAir],
  ] as const;
  const items = [];
  for (const [category, item] of rows) {
    if (!item) throw new Error("Fixture incomplete");
    const id = randomUUID(),
      offerId = randomUUID();
    await db.insert(schema.components).values({
      id,
      slug: "fixture-" + category,
      brand: "Fixture",
      model: item.nameDisplay,
      nameDisplay: item.nameDisplay,
      category,
      spec: item.spec,
      tdpW: item.tdpW,
    });
    await db.insert(schema.prices).values({
      id: offerId,
      componentId: id,
      storeId,
      amount: "100.00",
      currency: "BOB",
      inStock: true,
      observedAt: new Date(),
      sourceUrl: "https://fixture.invalid/price",
    });
    items.push({
      componentId: id,
      owned: category === "cpu",
      quantity: category === "ram" ? 2 : 1,
      offerId,
    });
  }
  input = { name: "Equipo de prueba", items };
}, 30000);
afterAll(async () => {
  await pg.close();
});
describe.sequential("PostgreSQL: circuito real de cotización", () => {
  it("aplica migraciones y lee UUID/ofertas vigentes", async () => {
    const catalog = await listCatalogForUi();
    expect(catalog).toHaveLength(8);
    expect(catalog.every((c) => c.priceBob === 100 && c.offerId)).toBe(true);
  });
  it("guarda cantidades y piezas propias con control de propietario", async () => {
    const result = await saveOwnedBuild(input, "owner-a");
    built = result.buildId;
    const saved = await db
      .select()
      .from(schema.buildItems)
      .where(eq(schema.buildItems.buildId, built));
    expect(saved.find((i) => i.isOwned)?.unitPriceBob).toBe("0.00");
    expect(saved.find((i) => i.quantity === 2)).toBeDefined();
    await expect(
      saveOwnedBuild({ ...input, id: built, name: "Intruso" }, "owner-b"),
    ).rejects.toThrow("acceso");
  });
  it("emite snapshot inmutable e idempotente con total de compras", async () => {
    requestKey = randomUUID();
    const result = await issueOwnedQuote(
      { buildId: built, requestKey, client: { name: "Cliente de prueba" }, isPublic: false },
      "owner-a",
    );
    quoteId = result.id;
    firstCode = result.code;
    expect(firstCode).toMatch(/^PRO-\d{4}-\d{5}$/);
    expect(result.created).toBe(true);
    const [record] = await db
      .select()
      .from(schema.proformas)
      .where(eq(schema.proformas.id, quoteId));
    expect(record!.totalBob).toBe("800.00");
    expect(record!.snapshot!.items).toHaveLength(7);
    const again = await issueOwnedQuote(
      { buildId: built, requestKey, client: { name: "Otro nombre" } },
      "owner-a",
    );
    expect(again.id).toBe(quoteId);
    expect(again.created).toBe(false);
    await db
      .update(schema.components)
      .set({ nameDisplay: "Nombre cambiado después de emitir" })
      .where(eq(schema.components.id, input.items[1]!.componentId));
    const document = await getAccessibleProforma(quoteId);
    expect(document!.items.some((i) => i.name === "Nombre cambiado después de emitir")).toBe(false);
  });
  it("no publica datos privados y el dueño conserva acceso", async () => {
    expect(await getPublicProforma(quoteId)).toBeNull();
    context.owner = "owner-b";
    expect(await getAccessibleProforma(quoteId)).toBeNull();
    context.owner = "owner-a";
    expect(await getAccessibleProforma(quoteId)).not.toBeNull();
    await expect(
      issueOwnedQuote(
        { buildId: built, requestKey: randomUUID(), client: { name: "Intruso" } },
        "owner-b",
      ),
    ).rejects.toThrow("acceso");
  });
  it("descuento inválido revierte inserción y contador", async () => {
    const before = await db.select().from(schema.proformaCounters);
    await expect(
      issueOwnedQuote(
        {
          buildId: built,
          requestKey: randomUUID(),
          client: { name: "Cliente" },
          discountBob: 99999,
        },
        "owner-a",
      ),
    ).rejects.toThrow();
    expect(await db.select().from(schema.proformaCounters)).toEqual(before);
  });
  it("solo publica una proforma con consentimiento explícito", async () => {
    const result = await issueOwnedQuote(
      {
        buildId: built,
        requestKey: randomUUID(),
        client: { name: "Cliente público de prueba" },
        isPublic: true,
      },
      "owner-a",
    );
    const published = await getPublicProforma(result.id);
    expect(published?.id).toBe(result.id);
    expect(published?.items[0]?.sourceUrl).toBe("https://fixture.invalid/price");
    expect(published?.items[0]?.specs?.length).toBeGreaterThan(0);
  });

  it("rechaza cantidades mayores al stock conocido", async () => {
    const ram = input.items.find((i) => i.quantity === 2)!;
    await db.update(schema.prices).set({ stockQty: 1 }).where(eq(schema.prices.id, ram.offerId));
    try {
      await expect(
        issueOwnedQuote(
          { buildId: built, requestKey: randomUUID(), client: { name: "Cliente" } },
          "owner-a",
        ),
      ).rejects.toThrow("stock");
    } finally {
      await db
        .update(schema.prices)
        .set({ stockQty: null })
        .where(eq(schema.prices.id, ram.offerId));
    }
  });
  it("no recupera un precio antiguo tras una observación sin stock", async () => {
    const first = input.items.find((i) => !i.owned)!;
    const [offer] = await db
      .select()
      .from(schema.prices)
      .where(eq(schema.prices.id, first.offerId));
    await db.insert(schema.prices).values({
      ...offer!,
      id: randomUUID(),
      inStock: false,
      observedAt: new Date(Date.now() + 1),
    });
    // Move its timestamp into the past, preserving ordering without a future feed.
    await db
      .update(schema.prices)
      .set({ observedAt: new Date(Date.now() - 1000) })
      .where(eq(schema.prices.id, first.offerId));
    const catalog = await listCatalogForUi();
    expect(catalog.find((c) => c.id === first.componentId)!.priceBob).toBeNull();
    await expect(
      issueOwnedQuote(
        { buildId: built, requestKey: randomUUID(), client: { name: "Cliente" } },
        "owner-a",
      ),
    ).rejects.toThrow(/oferta|cotización/i);
  });
  it("el correlativo funciona con ambas formas del driver y no inventa 1", () => {
    expect(counterValue([{ seq: 2 }])).toBe(2);
    expect(counterValue({ rows: [{ seq: 3 }] })).toBe(3);
    expect(() => counterValue({ rows: [] })).toThrow();
  });
  it("usa el año de Bolivia en el cambio de año", async () => {
    expect(await nextProformaCode(new Date("2027-01-01T01:00:00Z"))).toMatch(/^PRO-2026-/);
  });
});

it("adoptar migraciones conserva proformas previas y continúa su numeración", async () => {
  const legacy = new PGlite();
  try {
    const files = (await readdir("drizzle")).filter((p) => p.endsWith(".sql")).sort();
    await legacy.exec(await readFile(path.join("drizzle", files[0]!), "utf8"));
    const b = randomUUID();
    await legacy.query("INSERT INTO builds(id,name,share_slug) VALUES($1,$2,$3)", [
      b,
      "Registro legado",
      randomUUID(),
    ]);
    await legacy.query(
      "INSERT INTO proformas(code,build_id,client_name,subtotal_bob,total_bob,valid_until) VALUES($1,$2,$3,$4,$5,$6)",
      ["PRO-2026-00047", b, "Fixture", 100, 100, "2026-12-31"],
    );
    for (const file of files.slice(1))
      await legacy.exec(await readFile(path.join("drizzle", file), "utf8"));
    const result = await legacy.query<{ next_val: number }>(
      "SELECT next_val FROM proforma_counters WHERE year=2026",
    );
    expect(result.rows[0]?.next_val).toBe(48);
    expect(
      (await legacy.query<{ count: number }>("SELECT count(*)::int as count FROM proformas"))
        .rows[0]?.count,
    ).toBe(1);
  } finally {
    await legacy.close();
  }
}, 15000);
