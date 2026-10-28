export type OfferRow = {
  id: string;
  componentId: string;
  storeId: string;
  amount: string;
  currency: string;
  inStock: boolean;
  stockQty: number | null;
  observedAt: Date;
  sourceUrl: string | null;
};
export function selectCurrentOffers(
  rows: OfferRow[],
  activeStores: Set<string>,
  now = new Date(),
  ownStores = new Set<string>(),
) {
  const latest = new Map<string, OfferRow>();
  for (const row of [...rows].sort(
    (a, b) => b.observedAt.getTime() - a.observedAt.getTime() || b.id.localeCompare(a.id),
  )) {
    const key = row.componentId + ":" + row.storeId;
    if (!latest.has(key)) latest.set(key, row);
  }
  return [...latest.values()].filter(
    (r) =>
      activeStores.has(r.storeId) &&
      r.currency === "BOB" &&
      r.inStock &&
      (r.stockQty === null || r.stockQty > 0) &&
      Number(r.amount) > 0 &&
      r.observedAt.getTime() <= now.getTime() &&
      (ownStores.has(r.storeId) || now.getTime() - r.observedAt.getTime() <= 7 * 86400000) &&
      Boolean(r.sourceUrl && /^https?:\/\//.test(r.sourceUrl)),
  );
}
