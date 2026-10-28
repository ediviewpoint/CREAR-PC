import type { CatalogComponent, SelectedComponent } from "@/lib/catalog/types";
import { toBuildView, isCompleteBuild } from "@/lib/catalog/build";
import { evaluateBuild } from "@/lib/compat/evaluate";
import type { QuoteBuildInput } from "@/lib/schemas/quote";
export class QuoteError extends Error {}
export function prepareBuild(
  input: QuoteBuildInput,
  catalog: CatalogComponent[],
  requireQuote = false,
) {
  const selected: SelectedComponent[] = [];
  const ids = new Set<string>(),
    single = new Set<string>();
  for (const row of input.items) {
    if (ids.has(row.componentId))
      throw new QuoteError("Una pieza está repetida. Ajustá su cantidad.");
    ids.add(row.componentId);
    const component = catalog.find((c) => c.id === row.componentId);
    if (!component) throw new QuoteError("Una pieza ya no está disponible. Actualizá el catálogo.");
    if (!["ram", "storage"].includes(component.category)) {
      if (single.has(component.category))
        throw new QuoteError("Solo se permite una pieza de esta categoría.");
      single.add(component.category);
      if (row.quantity !== 1) throw new QuoteError("Esta categoría admite una unidad.");
    }
    if (!row.owned && component.offerId !== row.offerId)
      throw new QuoteError("La oferta cambió. Actualizá el catálogo.");
    if (requireQuote && !row.owned && (component.priceBob === null || !component.offerId))
      throw new QuoteError("Falta una cotización vigente.");
    if (
      requireQuote &&
      !row.owned &&
      component.stockQty != null &&
      row.quantity > component.stockQty
    )
      throw new QuoteError("La cantidad supera el stock informado por la tienda.");
    selected.push({ component, owned: row.owned, quantity: row.quantity });
  }
  const view = toBuildView(selected),
    report = evaluateBuild(view);
  if (requireQuote) {
    if (!isCompleteBuild(view)) throw new QuoteError("Completá las piezas esenciales del equipo.");
    if (!report.ok) throw new QuoteError("Resolvé las incompatibilidades antes de emitir.");
    if (!selected.some((s) => !s.owned)) throw new QuoteError("No hay piezas para comprar.");
  }
  return { selected, view, report };
}
