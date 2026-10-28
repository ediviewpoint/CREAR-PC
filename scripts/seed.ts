import { MVP_SLUGS } from "../lib/catalog/mvp";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { components } from "../lib/db/schema";
import { normalizeComponent, FILE_CATEGORIES } from "../lib/catalog/normalize";
const req = createRequire(path.join(process.cwd(), "package.json"));
createRequire(req.resolve("next/package.json"))("@next/env").loadEnvConfig(process.cwd());
async function main() {
  const records: (typeof components.$inferInsert)[] = [],
    stats: Record<string, { valid: number; invalid: number }> = {};
  for (const file of await readdir("data/seed")) {
    const kind = FILE_CATEGORIES[file];
    if (!kind) continue;
    const raw: unknown = JSON.parse(await readFile(path.join("data/seed", file), "utf8"));
    if (!Array.isArray(raw)) throw new Error("Dataset no válido");
    const stat = { valid: 0, invalid: 0 };
    stats[file] = stat;
    for (const value of raw) {
      const c = normalizeComponent(value, kind);
      if (!c) {
        stat.invalid++;
        continue;
      }
      stat.valid++;
      records.push({
        slug: c.slug,
        category: kind as typeof components.$inferInsert.category,
        brand: c.brand,
        model: c.name.startsWith(c.brand) ? c.name.slice(c.brand.length).trim() : c.name,
        nameDisplay: c.name,
        tdpW: c.selection.item.tdpW,
        spec: c.selection.item.spec,
        sources: c.sources,
      });
    }
  }
  const selected = records.filter((r) => MVP_SLUGS.includes(r.slug));
  if (selected.length !== MVP_SLUGS.length) throw new Error("Equipo mínimo incompleto.");
  console.log(JSON.stringify({ validated: records.length, selected: selected.length }, null, 2));
  if (process.argv.includes("--check")) return;
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL no definida.");
  const client = postgres(process.env.DATABASE_URL, {
      prepare: false,
      max: 1,
      connect_timeout: 10,
    }),
    db = drizzle(client);
  try {
    await db.transaction(async (tx) => {
      for (const row of selected)
        await tx
          .insert(components)
          .values(row)
          .onConflictDoUpdate({
            target: components.slug,
            set: {
              brand: row.brand,
              model: row.model,
              nameDisplay: row.nameDisplay,
              tdpW: row.tdpW,
              spec: row.spec,
              sources: row.sources,
              updatedAt: new Date(),
            },
          });
    });
    console.log("Catálogo importado. No se crearon precios ni tiendas ficticias.");
  } finally {
    await client.end();
  }
}
main().catch(() => {
  console.error("Importación no completada. Verificá datasets, migraciones y conexión PostgreSQL.");
  process.exitCode = 1;
});
