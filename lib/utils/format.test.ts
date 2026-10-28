import { describe, expect, it } from "vitest";
import { formatBob, formatGhz, formatMm, formatUsd, formatWatts } from "./format";

describe("formatBob", () => {
  it("formatea con dos decimales y separadores bolivianos", () => {
    const out = formatBob(15230);
    expect(out).toContain("15");
    expect(out).toContain("230");
    expect(out).toContain(",00");
  });

  it("maneja ceros", () => {
    expect(formatBob(0)).toContain("0,00");
  });

  it("maneja negativos (descuento)", () => {
    const out = formatBob(-500);
    expect(out).toContain("500");
  });
});

describe("formatUsd", () => {
  it("formatea en-US con símbolo", () => {
    expect(formatUsd(2500)).toBe("$2,500.00");
  });
});

describe("formatWatts", () => {
  it("redondea y añade W", () => {
    expect(formatWatts(540.7)).toBe("541 W");
    expect(formatWatts(100)).toBe("100 W");
  });
});

describe("formatMm", () => {
  it("concatena mm", () => {
    expect(formatMm(280)).toBe("280 mm");
  });
});

describe("formatGhz", () => {
  it("1 decimal + GHz", () => {
    expect(formatGhz(4.5)).toBe("4.5 GHz");
    expect(formatGhz(5)).toBe("5.0 GHz");
  });
});
