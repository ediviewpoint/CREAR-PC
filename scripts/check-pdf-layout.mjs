import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";
const require = createRequire(import.meta.url);
const esbuild = createRequire(require.resolve("tsx"))("esbuild");
const outfile = path.resolve("output/qa/check-pdf-layout.mjs");
try {
  await esbuild.build({ entryPoints: ["scripts/check-pdf-layout.tsx"], bundle: true, platform: "node", format: "esm", packages: "external", outfile, tsconfig: "tsconfig.json", jsx: "automatic" });
  const loadedQa = await import(pathToFileURL(outfile).href);
  await loadedQa.done;
} finally {
  await fs.unlink(outfile).catch(() => {});
}
