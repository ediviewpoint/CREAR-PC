import { describe, it, expect } from "vitest";
import { proformaSchema, proformaTotals } from "../types";
import { exampleProforma } from "../example";
describe("Proforma shared snapshot", () => {
  it("computes quantities and discounts in integer cents", () => {
    const d = {
      ...exampleProforma,
      items: [{ category: "RAM", name: "Fixture", quantity: 3, unitPriceBob: 0.1 }],
      discountBob: 0.1,
    };
    expect(proformaTotals(d)).toEqual({ subtotal: 0.3, discount: 0.1, total: 0.2 });
  });
  it("rejects a discount above the subtotal", () => {
    expect(proformaSchema.safeParse({ ...exampleProforma, discountBob: 100000 }).success).toBe(
      false,
    );
  });
  it("accepts official code or an explicit unissued draft", () => {
    expect(proformaSchema.safeParse(exampleProforma).success).toBe(true);
    expect(
      proformaSchema.safeParse({ ...exampleProforma, code: "BORRADOR", draft: true }).success,
    ).toBe(true);
    expect(proformaSchema.safeParse({ ...exampleProforma, code: "PRO-2026-1" }).success).toBe(
      false,
    );
  });
});

it("un precio pendiente solo es válido en borradores", () => {
  const draft = {
    ...exampleProforma,
    draft: true,
    code: "BORRADOR",
    discountBob: 0,
    items: [{ ...exampleProforma.items[0]!, unitPriceBob: 0, pricePending: true }],
  };
  expect(proformaSchema.safeParse(draft).success).toBe(true);
  expect(proformaSchema.safeParse({ ...draft, draft: false, code: "PRO-2026-00002" }).success).toBe(
    false,
  );
});
