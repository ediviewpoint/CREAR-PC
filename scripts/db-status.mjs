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
  const tables =
    await client`select table_name from information_schema.tables where table_schema='public' order by table_name`;
  const counts = {};
  for (const name of ["components", "prices", "stores", "builds", "proformas"])
    if (tables.some((t) => t.table_name === name)) {
      const r = await client`select count(*)::int as count from ${client(name)}`;
      counts[name] = r[0].count;
    }
  console.log(
    JSON.stringify(
      {
        configured: true,
        connected: true,
        counts,
        adminConfigured: Boolean(
          process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length >= 16,
        ),
      },
      null,
      2,
    ),
  );
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
