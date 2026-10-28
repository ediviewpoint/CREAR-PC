import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { findWorkedBrand, workedBrands } from "./brand-showcase";

describe("identidad de marcas", () => {
  it("reconoce abreviaturas sin asignar Ryzen a una GPU AMD", () => {
    expect(findWorkedBrand("WD")?.id).toBe("western-digital");
    expect(findWorkedBrand("Western Digital")?.id).toBe("western-digital");
    expect(findWorkedBrand("TEAM GROUP")?.id).toBe("teamgroup");
    expect(findWorkedBrand("HIK VISION")?.id).toBe("hikvision");
    expect(findWorkedBrand("AMD", "cpu")?.id).toBe("amd-ryzen");
    expect(findWorkedBrand("AMD", "gpu")).toBeUndefined();
  });
  it("mantiene IDs únicos y archivos locales sin contenido activo ni recursos remotos", () => {
    expect(new Set(workedBrands.map((brand) => brand.id)).size).toBe(workedBrands.length);
    for (const brand of workedBrands.filter((row) => row.logo)) {
      expect(brand.logo).toMatch(/^\/brands\/[a-z0-9-]+\.(svg|png)$/);
      if (!brand.logo!.endsWith(".svg")) continue;
      const svg = readFileSync(path.join(process.cwd(), "public", brand.logo!), "utf8");
      expect(svg).not.toMatch(/<script\b|<foreignObject\b|\bon\w+\s*=|javascript:|@import/i);
      expect(svg).not.toMatch(/(?:href|src)\s*=\s*["']https?:/i);
    }
  });
});
