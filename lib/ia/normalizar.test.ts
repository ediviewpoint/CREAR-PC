import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { ExtraccionSchema } from "./schemas";
import { limpiarEntrada, normalizeExtraction, mergeExtraction } from "./normalizar";
import { emptyProduct } from "@/lib/productos/schema";
const categories = [
  "NOTEBOOK",
  "MONITOR",
  "IMPRESORA",
  "TINTA",
  "ACCESORIO",
  "GAMER",
  "REPUESTO",
].map((nombre) => ({ id: nombre, nombre, plantillaTitulo: null }));
describe("Fixtures de extracción sin red", () => {
  for (const file of readdirSync("tests/fixtures/extraccion").filter((v) => v.endsWith(".json"))) {
    it(file, () => {
      const fixture = JSON.parse(readFileSync(`tests/fixtures/extraccion/${file}`, "utf8"));
      const text = limpiarEntrada(
        readFileSync(`tests/fixtures/extraccion/${file.replace(".json", ".txt")}`, "utf8"),
      );
      const normalized = normalizeExtraction(
        ExtraccionSchema.parse(fixture.response),
        categories,
        [],
        6.96,
        true,
        text,
      );
      for (const [key, value] of Object.entries(fixture.expected)) {
        if (key === "categoria") expect(normalized.producto.categoriaNombre ?? null).toBe(value);
        else
          expect(normalized.producto[key as keyof typeof normalized.producto] ?? null).toBe(value);
      }
      expect(normalized.producto.specs?.every((s) => s.valor.length > 0)).toBe(true);
    });
  }
  it("no sobrescribe datos manuales y conserva specs que la IA no trajo", () => {
    const current = {
      ...emptyProduct(),
      marca: "HP",
      precioSinFactura: 548000,
      specs: [{ campo: "RAM", valor: "4 GB", origen: "MANUAL" as const, confirmado: true }],
    };
    const proposal = {
      marca: "Dell",
      precioSinFactura: 100,
      specs: [
        { campo: "RAM", valor: "8 GB", origen: "TEXTO" as const, confirmado: true },
        { campo: "Pantalla", valor: '14"', origen: "TEXTO" as const, confirmado: true },
      ],
    };
    expect(mergeExtraction(current, proposal, "vacios").marca).toBe("HP");
    expect(mergeExtraction(current, proposal, "vacios").specs[0]?.valor).toBe("4 GB");
    expect(mergeExtraction(current, proposal, "reemplazar").specs).toHaveLength(2);
    expect(current.specs).toHaveLength(1);
  });
  it("descarta una especificación sin evidencia", () => {
    const fixture = JSON.parse(readFileSync("tests/fixtures/extraccion/01-ejemplo.json", "utf8"));
    fixture.response.specs.push({
      campo: "Batería",
      valor: "24 horas",
      evidencia: "inventado",
      confianza: "alta",
    });
    const result = normalizeExtraction(
      ExtraccionSchema.parse(fixture.response),
      categories,
      [],
      6.96,
      true,
      "4GB RAM 128GB UFS",
    );
    expect(result.producto.specs?.some((v) => v.campo === "Batería")).toBe(false);
  });
});
