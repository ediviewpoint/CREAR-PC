import { describe, it, expect } from "vitest";
import { roundBob, withInvoice, usdToBob, parseAmount } from "./precios";
import { SKU_PATTERN, isValidSku } from "./sku";
describe("Precios en centavos y SKU", () => {
  it("convierte y redondea sin errores de escala", () => {
    expect(roundBob(547700)).toBe(548000);
    expect(withInvoice(548000)).toBe(636000);
    expect(usdToBob(78500, 6.96)).toBe(546000);
    expect(parseAmount("5.480,50")).toBe(548050);
  });
  it("valida todos los prefijos de SKU", () => {
    for (const value of ["Z2715", "A123", "B99999"]) expect(isValidSku(value)).toBe(true);
    for (const value of ["z1234", "ZZ1234", "Z12", "Z123456"])
      expect(SKU_PATTERN.test(value)).toBe(false);
  });
});
