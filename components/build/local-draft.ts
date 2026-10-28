import { z } from "zod";
import type { CatalogComponent, SelectedComponent } from "@/lib/catalog/types";

export const DRAFT_KEY = "crearpc.build.draft";
const schema = z.object({
  name: z.string().max(160),
  items: z
    .array(
      z.object({
        slug: z.string(),
        owned: z.boolean(),
        quantity: z.number().int().min(1).max(16),
      }),
    )
    .max(30),
});

export function readDraft(catalog: CatalogComponent[]) {
  try {
    const data = schema.parse(JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? "null"));
    const selected: SelectedComponent[] = [];
    for (const item of data.items) {
      const component = catalog.find((c) => c.slug === item.slug);
      if (component && !selected.some((row) => row.component.category === component.category)) {
        selected.push({ component, owned: item.owned, quantity: item.quantity });
      }
    }
    return { name: data.name, selected };
  } catch {
    return null;
  }
}

export function writeDraft(name: string, selected: SelectedComponent[]) {
  sessionStorage.setItem(
    DRAFT_KEY,
    JSON.stringify({
      name,
      items: selected.map(({ component, owned, quantity = 1 }) => ({
        slug: component.slug,
        owned,
        quantity,
      })),
    }),
  );
}
