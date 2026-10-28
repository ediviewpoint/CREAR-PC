import "server-only";
import { readdir } from "node:fs/promises";
import path from "node:path";
import type { CatalogComponent } from "./types";

/** Optional, exact-model photos supplied by the business. Database images take priority. */
export async function withProductPhotos(catalog: CatalogComponent[]): Promise<CatalogComponent[]> {
  let files: string[];
  try {
    files = await readdir(path.join(process.cwd(), "public/products"));
  } catch {
    return catalog;
  }
  return catalog.map((component) => {
    if (component.image) return component;
    const file = ["webp", "jpg", "jpeg", "png"]
      .map((extension) => `${component.slug}.${extension}`)
      .find((name) => files.includes(name));
    return file
      ? { ...component, image: `/products/${file}`, imageAlt: `Fotografía de ${component.name}` }
      : component;
  });
}
