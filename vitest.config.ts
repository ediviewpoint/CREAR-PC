import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

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
      "@": path.resolve(__dirname, "."),
      // Permitir importar módulos marcados "server-only" en Vitest.
      "server-only": path.resolve(__dirname, "./test/stubs/server-only.ts"),
    },
  },
});
