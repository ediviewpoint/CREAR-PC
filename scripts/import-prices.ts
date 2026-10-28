import { readFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { inArray } from "drizzle-orm";
import { z } from "zod";
import { components, stores, prices } from "../lib/db/schema";

const req = createRequire(path.join(process.cwd(), "package.json"));
createRequire(req.resolve("next/package.json"))("@next/env").loadEnvConfig(process.cwd());

const slug = z
  .string()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug debe ser kebab-case");

const storeSchema = z.object({
  slug,
  name: z.string().min(2).max(120),
  city: z.string().min(2).max(80),
  address: z.string().max(240).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  whatsapp: z.string().max(40).optional().nullable(),
  website: z.string().url().optional().nullable(),
  isActive: z.boolean().default(true),
});

const SEVEN_DAYS_MS = 7 * 86_400_000;

const offerSchema = z.object({
  componentSlug: slug,
  storeSlug: slug,
  amountBob: z.number().positive().max(1_000_000),
  inStock: z.boolean(),
  stockQty: z.number().int().nonnegative().optional().nullable(),
  observedAt: z.iso.datetime(),
  sourceUrl: z.url().refine((u) => u.startsWith("https://"), "sourceUrl debe ser HTTPS"),
});

async function loadJson<T>(file: string, parser: z.ZodType<T[]>): Promise<T[]> {
  const raw: unknown = JSON.parse(await readFile(file, "utf8"));
  if (!Array.isArray(raw)) throw new Error(`${file}: se esperaba un arreglo.`);
  return parser.parse(raw);
}

async function main() {
  const check = process.argv.includes("--check");
  const storesFile = path.join("data", "prices", "stores.json");
  const offersFile = path.join("data", "prices", "offers.json");

  const parsedStores = await loadJson(storesFile, z.array(storeSchema));
  const parsedOffers = await loadJson(offersFile, z.array(offerSchema));

  const storeSlugs = new Set(parsedStores.map((s) => s.slug));
  if (storeSlugs.size !== parsedStores.length)
    throw new Error("stores.json contiene slugs duplicados.");

  const now = Date.now();
  for (const offer of parsedOffers) {
    const t = new Date(offer.observedAt).getTime();
    if (t > now) throw new Error(`observedAt futuro: ${offer.sourceUrl}`);
    if (now - t > SEVEN_DAYS_MS)
      throw new Error(`observedAt > 7 días: ${offer.sourceUrl} (${offer.observedAt})`);
    if (!storeSlugs.has(offer.storeSlug))
      throw new Error(`offer referencia storeSlug inexistente: ${offer.storeSlug}`);
  }

  const componentSlugsNeeded = [...new Set(parsedOffers.map((o) => o.componentSlug))];

  console.log(
    JSON.stringify(
      {
        stores: parsedStores.length,
        offers: parsedOffers.length,
        componentsReferenced: componentSlugsNeeded.length,
        mode: check ? "check" : "apply",
      },
      null,
      2,
    ),
  );

  if (check) return;
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL no definida.");
  if (parsedStores.length === 0 && parsedOffers.length === 0) {
    console.log("Nada que importar: ambos archivos están vacíos.");
    return;
  }

  const client = postgres(process.env.DATABASE_URL, {
    prepare: false,
    max: 1,
    connect_timeout: 10,
  });
  const db = drizzle(client);

  try {
    await db.transaction(async (tx) => {
      const storeIdBySlug = new Map<string, string>();
      for (const s of parsedStores) {
        const [row] = await tx
          .insert(stores)
          .values({
            slug: s.slug,
            name: s.name,
            city: s.city,
            address: s.address ?? null,
            phone: s.phone ?? null,
            whatsapp: s.whatsapp ?? null,
            website: s.website ?? null,
            isActive: s.isActive,
          })
          .onConflictDoUpdate({
            target: stores.slug,
            set: {
              name: s.name,
              city: s.city,
              address: s.address ?? null,
              phone: s.phone ?? null,
              whatsapp: s.whatsapp ?? null,
              website: s.website ?? null,
              isActive: s.isActive,
            },
          })
          .returning({ id: stores.id, slug: stores.slug });
        if (!row) throw new Error(`No se pudo upsertar tienda ${s.slug}.`);
        storeIdBySlug.set(row.slug, row.id);
      }

      if (parsedOffers.length) {
        const componentRows = await tx
          .select({ id: components.id, slug: components.slug })
          .from(components)
          .where(inArray(components.slug, componentSlugsNeeded));
        const componentIdBySlug = new Map(componentRows.map((c) => [c.slug, c.id]));
        const missing = componentSlugsNeeded.filter((s) => !componentIdBySlug.has(s));
        if (missing.length)
          throw new Error(`Componentes no encontrados en DB: ${missing.join(", ")}`);

        const existingStores = await tx
          .select({ id: stores.id, slug: stores.slug })
          .from(stores)
          .where(inArray(stores.slug, [...new Set(parsedOffers.map((o) => o.storeSlug))]));
        for (const r of existingStores) storeIdBySlug.set(r.slug, r.id);

        for (const o of parsedOffers) {
          const componentId = componentIdBySlug.get(o.componentSlug);
          const storeId = storeIdBySlug.get(o.storeSlug);
          if (!componentId || !storeId)
            throw new Error(`Referencias no resueltas: ${o.componentSlug} / ${o.storeSlug}`);
          await tx.insert(prices).values({
            componentId,
            storeId,
            currency: "BOB",
            amount: o.amountBob.toFixed(2),
            inStock: o.inStock,
            stockQty: o.stockQty ?? null,
            observedAt: new Date(o.observedAt),
            sourceUrl: o.sourceUrl,
          });
        }
      }
    });

    console.log(
      `Importación aplicada: ${parsedStores.length} tienda(s), ${parsedOffers.length} oferta(s).`,
    );
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(
    "Importación no completada:",
    err instanceof Error ? err.message : String(err),
  );
  process.exitCode = 1;
});
