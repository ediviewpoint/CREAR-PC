import { MVP_SLUGS } from "./mvp";
import "server-only";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { listCatalogForUi } from "@/lib/db/repos/catalog";
import { normalizeComponent, FILE_CATEGORIES } from "./normalize";
import type { CatalogComponent } from "./types";
import { withProductPhotos } from "./product-media";
let unavailableUntil = 0;
export const getCatalog = cache(async (): Promise<CatalogComponent[]> => {
  if (process.env.DATABASE_URL) {
    if (Date.now() < unavailableUntil) throw new Error("El catálogo no está disponible temporalmente.");
    try {
      const rows = await listCatalogForUi();
      return withProductPhotos(rows);
    } catch {
      unavailableUntil = Date.now() + 30000;
      console.warn("[catalog] Base de datos no disponible.");
      throw new Error("El catálogo no está disponible temporalmente.");
    }
  }
  const dir = path.join(process.cwd(), "data/seed"),
    result: CatalogComponent[] = [];
  for (const name of await readdir(dir)) {
    const kind = FILE_CATEGORIES[name];
    if (!kind) continue;
    const raw: unknown = JSON.parse(await readFile(path.join(dir, name), "utf8"));
    if (!Array.isArray(raw)) continue;
    for (const row of raw) {
      const c = normalizeComponent(row, kind);
      if (c && MVP_SLUGS.includes(c.slug)) result.push({ ...c, source: "seed" });
    }
  }
  return withProductPhotos(result);
});
