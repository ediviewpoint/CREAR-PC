import { createRequire } from "node:module";
import path from "node:path";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
const req = createRequire(path.join(process.cwd(), "package.json"));
createRequire(req.resolve("next/package.json"))("@next/env").loadEnvConfig(process.cwd());
async function main() {
  if (!process.env.DATABASE_URL) throw new Error("Configurá DATABASE_URL en .env.local.");
  const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1, connect_timeout: 10 });
  try {
    await migrate(drizzle(sql), { migrationsFolder: "drizzle" });
    console.log("Migraciones aplicadas.");
  } finally {
    await sql.end();
  }
}
main().catch(() => {
  console.error(
    "No se pudieron aplicar las migraciones. Revisá DATABASE_URL y el acceso a PostgreSQL.",
  );
  process.exitCode = 1;
});
