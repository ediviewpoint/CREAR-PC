import { describe, it, expect } from "vitest";
import { selectCurrentOffers } from "../offers";
const now = new Date("2026-10-28T12:00:00Z");
const row = {
  id: "a",
  componentId: "cpu",
  storeId: "store",
  amount: "100",
  currency: "BOB",
  inStock: true,
  stockQty: 1,
  observedAt: new Date("2026-10-28T11:00:00Z"),
  sourceUrl: "https://fixture.invalid",
};
describe("Ofertas", () => {
  it("rechaza precios vencidos, futuros, sin fuente, sin stock y tiendas inactivas", () => {
    for (const extra of [
      { observedAt: new Date("2026-10-01") },
      { observedAt: new Date("2027-01-01") },
      { sourceUrl: null },
      { stockQty: 0 },
      { amount: "0" },
      { inStock: false },
    ])
      expect(selectCurrentOffers([{ ...row, ...extra }], new Set(["store"]), now)).toHaveLength(0);
    expect(selectCurrentOffers([row], new Set(), now)).toHaveLength(0);
  });
  it("la última observación sin stock invalida la oferta anterior", () => {
    expect(
      selectCurrentOffers(
        [row, { ...row, id: "b", inStock: false, observedAt: now }],
        new Set(["store"]),
        now,
      ),
    ).toHaveLength(0);
  });
});
