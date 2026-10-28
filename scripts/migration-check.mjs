import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import postgres from "postgres";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { inspectMigrationHistory } from "./lib/migration-history.mjs";

const require = createRequire(import.meta.url);
createRequire(require.resolve("next/package.json"))("@next/env").loadEnvConfig(process.cwd());
if (!process.env.DATABASE_URL) {
  console.log(JSON.stringify({ connected: false, message: "Falta DATABASE_URL." }));
  process.exit(1);
}
const client = postgres(process.env.DATABASE_URL, { prepare: false, max: 1, connect_timeout: 10 });
try {
  const migrations = readMigrationFiles({ migrationsFolder: "drizzle" });
  const journal = JSON.parse(await readFile("drizzle/meta/_journal.json", "utf8"));
  await client`begin read only`;
  await client`set local statement_timeout = '10s'`;
  const [tables] =
    await client`select to_regclass('drizzle.__drizzle_migrations') is not null as history, to_regclass('public.components') is not null as catalog`;
  const applied = tables.history
    ? await client`select hash, created_at from drizzle.__drizzle_migrations order by created_at, id`
    : [];
  await client`rollback`;
  const report = inspectMigrationHistory(migrations, journal, applied);
  if (tables.catalog && !applied.length)
    report.issues.push(
      "La base contiene catálogo pero no tiene historial aplicado. No ejecutar el migrador sin revisar la adopción del esquema existente.",
    );
  console.log(
    JSON.stringify(
      {
        connected: true,
        historyPresent: tables.history,
        ...report,
        ready: !report.issues.length && !report.pending.length,
      },
      null,
      2,
    ),
  );
  if (report.issues.length || report.pending.length) process.exitCode = 1;
} catch {
  console.log(
    JSON.stringify({
      connected: false,
      message:
        "No se pudo verificar el historial. Revisá conexión, permisos y archivos de migración; no se aplicaron cambios.",
    }),
  );
  process.exitCode = 1;
} finally {
  await client.end({ timeout: 5 });
}
