import { createRequire } from "node:module";
import { defineConfig } from "prisma/config";

const require = createRequire(import.meta.url);
createRequire(require.resolve("next/package.json"))("@next/env").loadEnvConfig(process.cwd());

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  // DECISION: una URL de compilación local permite generar tipos sin leer ni modificar producción.
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/elitepc",
  },
});
