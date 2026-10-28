import { createRequire } from "node:module";
import path from "node:path";
const req = createRequire(path.join(process.cwd(), "package.json"));
createRequire(req.resolve("next/package.json"))("@next/env").loadEnvConfig(process.cwd());
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL no está definida. Las migraciones no funcionarán hasta configurarla.");
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://user:pass@localhost:5432/crearpc",
  },
  verbose: true,
  strict: true,
});
