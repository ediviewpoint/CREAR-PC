import { createRequire } from "node:module";
import postgres from "postgres";
const req = createRequire(import.meta.url);
createRequire(req.resolve("next/package.json"))("@next/env").loadEnvConfig(process.cwd());
if (!process.env.DATABASE_URL) {
  console.log(JSON.stringify({ configured: false, connected: false }));
  process.exit(1);
}
const client = postgres(process.env.DATABASE_URL, { prepare: false, max: 1, connect_timeout: 10 });
try {
  await client`begin read only`;
  await client`set local statement_timeout = '10s'`;
  const tables =
    await client`select table_name from information_schema.tables where table_schema='public' order by table_name`;
  const counts = {};
  for (const name of ["components", "prices", "stores", "builds", "proformas"])
    if (tables.some((t) => t.table_name === name)) {
      const r = await client`select count(*)::int as count from ${client(name)}`;
      counts[name] = r[0].count;
    }
  const requiredTables = [
    "components",
    "component_images",
    "stores",
    "prices",
    "builds",
    "build_items",
    "proformas",
    "proforma_counters",
  ];
  const missingTables = requiredTables.filter(
    (name) => !tables.some((table) => table.table_name === name),
  );
  const columns =
    await client`select table_name, column_name from information_schema.columns where table_schema='public'`;
  const requiredColumns = [
    ["components", "warranty_months"],
    ["stores", "slug"],
    ["stores", "is_own"],
    ["builds", "owner_token_hash"],
    ["proformas", "request_key"],
  ];
  const missingColumns = requiredColumns
    .filter(
      ([table, column]) =>
        !columns.some((item) => item.table_name === table && item.column_name === column),
    )
    .map(([table, column]) => `${table}.${column}`);
  await client`rollback`;
  console.log(
    JSON.stringify(
      {
        configured: true,
        connected: true,
        counts,
        schemaChecks: {
          missingTables,
          missingColumns,
          passed: !missingTables.length && !missingColumns.length,
          scope:
            "Tablas y columnas esenciales; no sustituye la revisión del historial completo de migraciones.",
        },
        adminConfigured: Boolean(
          process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length >= 16,
        ),
      },
      null,
      2,
    ),
  );
  if (missingTables.length || missingColumns.length) process.exitCode = 1;
} catch {
  console.log(
    JSON.stringify(
      {
        configured: true,
        connected: false,
        adminConfigured: Boolean(
          process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length >= 16,
        ),
        message: "Revisá DATABASE_URL, tenant y acceso al servidor PostgreSQL.",
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
} finally {
  await client.end();
}
