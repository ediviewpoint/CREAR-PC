// Existing production schema is adopted only after every historical checksum matches.
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { readMigrationFiles } from "drizzle-orm/migrator";
import pg from "pg";
import { inspectMigrationHistory } from "./lib/migration-history.mjs";
const require = createRequire(import.meta.url);
createRequire(require.resolve("next/package.json"))("@next/env").loadEnvConfig(process.cwd());
async function main() {
  if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL");
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
  });
  await client.connect();
  let adopt = false;
  try {
    await client.query("BEGIN READ ONLY");
    const {
      rows: [state],
    } = await client.query(
      "SELECT to_regclass('public.components') IS NOT NULL AS legacy, to_regclass('public.\"_prisma_migrations\"') IS NOT NULL AS prisma, to_regclass('drizzle.__drizzle_migrations') IS NOT NULL AS history",
    );
    if (state.prisma) {
      console.log("El historial Prisma ya existe. Usa prisma:migrate para continuar.");
      return;
    }
    if (!state.legacy) {
      console.log("Base nueva: no requiere adopción. Usa prisma:migrate.");
      return;
    }
    if (!state.history)
      throw new Error("Base existente sin historial verificable. No se modificó nada.");
    const { rows } = await client.query(
      "SELECT hash,created_at FROM drizzle.__drizzle_migrations ORDER BY created_at,id",
    );
    const report = inspectMigrationHistory(
      readMigrationFiles({ migrationsFolder: "drizzle" }),
      JSON.parse(await readFile("drizzle/meta/_journal.json", "utf8")),
      rows,
    );
    if (report.issues.length || report.pending.length)
      throw new Error(
        "El historial anterior tiene diferencias o migraciones pendientes. No se modificó nada.",
      );
    adopt = true;
  } finally {
    await client.query("ROLLBACK");
    await client.end();
  }
  if (adopt && !process.argv.includes("--apply")) {
    console.log(
      "Historial verificado. Repite con --apply para registrar la base existente; no recrea ni borra tablas.",
    );
    return;
  }
  if (adopt) {
    const result = spawnSync(
      process.execPath,
      [
        require.resolve("prisma/build/index.js"),
        "migrate",
        "resolve",
        "--applied",
        "20261028000000_legacy",
      ],
      { stdio: "inherit", env: process.env, windowsHide: true },
    );
    if (result.status !== 0) throw new Error("No se pudo registrar la base existente.");
    console.log(
      "Base anterior adoptada. Revisa y ejecuta prisma:migrate para crear las tablas administrativas.",
    );
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
