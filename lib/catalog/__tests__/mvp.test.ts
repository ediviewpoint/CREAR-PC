import { it, expect } from "vitest";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { MVP_SLUGS } from "../mvp";
import { normalizeComponent, FILE_CATEGORIES } from "../normalize";
import { toBuildView, isCompleteBuild } from "../build";
import { evaluateBuild } from "@/lib/compat/evaluate";
it("la versión mínima tiene una pieza por categoría y arma un equipo compatible", async () => {
  const selected = [];
  for (const file of await readdir("data/seed")) {
    const kind = FILE_CATEGORIES[file];
    if (!kind) continue;
    const rows: unknown[] = JSON.parse(await readFile(path.join("data/seed", file), "utf8"));
    for (const row of rows) {
      const c = normalizeComponent(row, kind);
      if (c && MVP_SLUGS.includes(c.slug))
        selected.push({ component: c, owned: false, quantity: 1 });
    }
  }
  expect(selected).toHaveLength(8);
  expect(new Set(selected.map((s) => s.component.category)).size).toBe(8);
  const build = toBuildView(selected);
  expect(isCompleteBuild(build)).toBe(true);
  expect(evaluateBuild(build).ok).toBe(true);
});
