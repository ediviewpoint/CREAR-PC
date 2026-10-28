import "server-only";
import { randomUUID } from "node:crypto";
import { eq, and, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { listCatalogForUi } from "@/lib/db/repos/catalog";
import { getBuildWithItems } from "@/lib/db/repos/builds";
import { prepareBuild, QuoteError } from "./prepare";
import { quoteBuildInput, issueQuoteInput } from "@/lib/schemas/quote";
import { nextProformaCode } from "@/lib/proforma/sequence";
import { proformaSchema, proformaTotals } from "@/lib/proforma/types";
import { sanitizeNit, sanitizePhoneBO, sanitizeText } from "@/lib/sanitize";
import { CATEGORIES } from "@/lib/catalog/types";
import { warrantyLabel } from "@/lib/catalog/warranty";
export async function saveOwnedBuild(raw: unknown, owner: string) {
  const input = quoteBuildInput.parse(raw),
    catalog = await listCatalogForUi(),
    prepared = prepareBuild(input, catalog);
  return getDb().transaction(async (tx) => {
    const id = input.id ?? randomUUID();
    if (input.id) {
      const [existing] = await tx
        .select()
        .from(schema.builds)
        .where(eq(schema.builds.id, id))
        .for("update");
      if (!existing || existing.ownerTokenHash !== owner)
        throw new QuoteError("No tenés acceso a este build.");
      await tx
        .update(schema.builds)
        .set({
          name: input.name,
          isPublic: input.isPublic,
          totalBob: prepared.report.totalBob.toFixed(2),
          compatReport: prepared.report,
          updatedAt: new Date(),
        })
        .where(eq(schema.builds.id, id));
      await tx.delete(schema.buildItems).where(eq(schema.buildItems.buildId, id));
    } else
      await tx.insert(schema.builds).values({
        id,
        name: input.name,
        ownerTokenHash: owner,
        shareSlug: randomUUID(),
        isPublic: input.isPublic,
        totalBob: prepared.report.totalBob.toFixed(2),
        compatReport: prepared.report,
      });
    await tx.insert(schema.buildItems).values(
      prepared.selected.map((s, index) => ({
        buildId: id,
        componentId: s.component.id,
        quantity: s.quantity ?? 1,
        isOwned: s.owned,
        offerId: s.owned ? null : (s.component.offerId ?? null),
        unitPriceBob: (s.owned ? 0 : (s.component.priceBob ?? 0)).toFixed(2),
        sortOrder: index,
      })),
    );
    return { buildId: id, report: prepared.report };
  });
}
export async function issueOwnedQuote(raw: unknown, owner: string) {
  const input = issueQuoteInput.parse(raw);
  const bundle = await getBuildWithItems(input.buildId);
  if (!bundle || bundle.build.ownerTokenHash !== owner)
    throw new QuoteError("No tenés acceso a este build.");
  const [issued] = await getDb()
    .select()
    .from(schema.proformas)
    .where(eq(schema.proformas.requestKey, input.requestKey));
  if (issued) {
    if (issued.buildId !== input.buildId) throw new QuoteError("La solicitud ya fue utilizada.");
    return { id: issued.id, code: issued.code, created: false as const };
  }
  const catalog = await listCatalogForUi();
  const prepared = prepareBuild(
    {
      id: input.buildId,
      name: bundle.build.name,
      isPublic: bundle.build.isPublic,
      items: bundle.items.map((i) => ({
        componentId: i.componentId,
        owned: i.isOwned,
        quantity: i.quantity,
        offerId: i.offerId ?? undefined,
      })),
    },
    catalog,
    true,
  );
  return getDb().transaction(async (tx) => {
    const [locked] = await tx
      .select()
      .from(schema.builds)
      .where(and(eq(schema.builds.id, input.buildId), eq(schema.builds.ownerTokenHash, owner)))
      .for("update");
    if (!locked || locked.updatedAt.getTime() !== bundle.build.updatedAt.getTime())
      throw new QuoteError("El build cambió. Volvé a guardar antes de emitir.");
    const [previous] = await tx
      .select()
      .from(schema.proformas)
      .where(eq(schema.proformas.requestKey, input.requestKey));
    if (previous) {
      if (previous.buildId !== input.buildId)
        throw new QuoteError("La solicitud ya fue utilizada.");
      return { id: previous.id, code: previous.code, created: false as const };
    }
    for (const s of prepared.selected.filter((s) => !s.owned)) {
      const [offer] = await tx
        .select()
        .from(schema.prices)
        .where(eq(schema.prices.id, s.component.offerId!));
      if (!offer || !offer.inStock) throw new QuoteError("Una oferta dejó de estar disponible.");
      const [latest] = await tx
        .select()
        .from(schema.prices)
        .where(
          and(
            eq(schema.prices.componentId, offer.componentId),
            eq(schema.prices.storeId, offer.storeId),
          ),
        )
        .orderBy(sql`${schema.prices.observedAt} DESC`, sql`${schema.prices.id} DESC`)
        .limit(1);
      if (latest?.id !== offer.id) throw new QuoteError("El precio cambió. Actualizá tu build.");
    }
    const issuedAt = new Date(),
      issuedDate = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/La_Paz" }).format(
        issuedAt,
      );
    const until = new Date(issuedDate + "T00:00:00Z");
    until.setUTCDate(until.getUTCDate() + input.validityDays);
    const id = randomUUID(),
      code = await nextProformaCode(issuedAt, tx);
    const snapshot = proformaSchema.parse({
      id,
      code,
      draft: false,
      example: false,
      name: bundle.build.name,
      client: {
        name: sanitizeText(input.client.name, 160),
        ...(input.client.ciNit ? { ciNit: sanitizeNit(input.client.ciNit) } : {}),
        ...(input.client.phone ? { phone: sanitizePhoneBO(input.client.phone) } : {}),
      },
      issuer: { name: "ELITEPC", city: "Santa Cruz, Bolivia" },
      issuedAt: issuedDate,
      validUntil: until.toISOString().slice(0, 10),
      items: prepared.selected
        .filter((s) => !s.owned)
        .map((s) => ({
          category:
            CATEGORIES.find((c) => c.key === s.component.category)?.label ?? s.component.category,
          name: s.component.name,
          warranty: warrantyLabel(s.component.warrantyMonths),
          quantity: s.quantity ?? 1,
          unitPriceBob: s.component.priceBob!,
          componentId: s.component.id,
          specs: s.component.specs,
          ...(s.component.priceSource
            ? {
                storeName: s.component.priceSource.store,
                sourceUrl: s.component.priceSource.url,
                observedAt: s.component.priceSource.observedAt,
              }
            : {}),
        })),
      discountBob: input.discountBob,
      terms: [
        "Precios en Bolivianos. Sujetos a disponibilidad de stock.",
        "Validez: " + input.validityDays + " días calendario desde la emisión.",
        "No es factura. No habilita crédito fiscal.",
        "Montaje y entrega no incluidos salvo indicación expresa.",
        "La garantía comercial de cada pieza se indica en su detalle. Consultá las condiciones de cobertura antes de comprar.",
      ],
    });
    const totals = proformaTotals(snapshot);
    await tx.insert(schema.proformas).values({
      id,
      code,
      buildId: input.buildId,
      requestKey: input.requestKey,
      isPublic: input.isPublic,
      clientName: snapshot.client.name,
      clientCiNit: snapshot.client.ciNit ?? null,
      clientPhone: snapshot.client.phone ?? null,
      clientEmail: input.client.email || null,
      subtotalBob: totals.subtotal.toFixed(2),
      discountBob: totals.discount.toFixed(2),
      totalBob: totals.total.toFixed(2),
      issuedAt,
      validUntil: snapshot.validUntil,
      terms: snapshot.terms.join("\n"),
      snapshot,
    });
    return { id, code, created: true as const };
  });
}
