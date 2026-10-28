import "server-only";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { normalizeComponent } from "@/lib/catalog/normalize";
import { selectCurrentOffers } from "@/lib/catalog/offers";
import type { CatalogComponent } from "@/lib/catalog/types";
export async function listCatalogForUi(): Promise<CatalogComponent[]> {
  const db = getDb();
  const [components, prices, stores, images, benches] = await Promise.all([
    db.select().from(schema.components).where(eq(schema.components.isActive, true)),
    db.select().from(schema.prices),
    db.select().from(schema.stores).where(eq(schema.stores.isActive, true)),
    db.select().from(schema.componentImages),
    db.select().from(schema.benchmarks),
  ]);
  const current = selectCurrentOffers(prices, new Set(stores.map((s) => s.id)));
  return components
    .flatMap((c) => {
      const item = normalizeComponent(
        {
          id: c.id,
          slug: c.slug,
          brand: c.brand,
          name_display: c.nameDisplay,
          tdp_w: c.tdpW,
          spec: c.spec,
          sources: c.sources,
        },
        c.category,
      );
      if (!item) return [];
      const offers = current
          .filter((o) => o.componentId === c.id)
          .sort((a, b) => Number(a.amount) - Number(b.amount)),
        best = offers[0];
      const image = images
        .filter((i) => i.componentId === c.id)
        .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.sortOrder - b.sortOrder)[0];
      return [
        {
          ...item,
          source: "database" as const,
          priceBob: best ? Number(best.amount) : null,
          stockQty: best?.stockQty ?? null,
          offerId: best?.id,
          priceMaxBob: offers.length ? Number(offers[offers.length - 1]!.amount) : undefined,
          storeCount: offers.length,
          priceSource: best
            ? {
                url: best.sourceUrl!,
                observedAt: best.observedAt.toISOString(),
                store: stores.find((s) => s.id === best.storeId)?.name ?? "Tienda",
              }
            : undefined,
          ...(image ? { image: image.url, imageAlt: image.altEs } : {}),
          benchmarks: benches
            .filter((b) => b.componentId === c.id && Number(b.score) > 0)
            .map((b) => ({
              name: b.benchName,
              score: Number(b.score),
              max: Math.max(
                Number(b.score),
                ...benches.filter((p) => p.benchName === b.benchName).map((p) => Number(p.score)),
              ),
              sourceUrl: b.sourceUrl,
            })),
        },
      ];
    })
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}
