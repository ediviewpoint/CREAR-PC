import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/.next/**", "**/dist/**", "**/e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: ["**/*.config.*", "**/node_modules/**", "scripts/**", "e2e/**"],
    },
  },
  resolve: {
    alias: {
      "@": rootDir,
      // Permitir importar módulos marcados "server-only" en Vitest.
      "server-only": path.resolve(rootDir, "./test/stubs/server-only.ts"),
    },
  },
});
