import { describe, expect, it } from "vitest";
import { counterValue } from "./sequence";

describe("counterValue", () => {
  it("parsea resultado postgres-js (array directo)", () => {
    expect(counterValue([{ seq: 42 }])).toBe(42);
  });

  it("parsea resultado node-postgres ({ rows: [...] })", () => {
    expect(counterValue({ rows: [{ seq: 7 }] })).toBe(7);
  });

  it("acepta seq como string coercible a número (postgres bigint)", () => {
    expect(counterValue([{ seq: "123" }])).toBe(123);
  });

  it("rechaza seq fuera de rango (max 99999)", () => {
    expect(() => counterValue([{ seq: 100000 }])).toThrow();
  });

  it("rechaza seq cero o negativo", () => {
    expect(() => counterValue([{ seq: 0 }])).toThrow();
  });

  it("rechaza resultado vacío", () => {
    expect(() => counterValue([])).toThrow();
    expect(() => counterValue({ rows: [] })).toThrow();
  });

  it("rechaza payload totalmente distinto", () => {
    expect(() => counterValue(null)).toThrow();
    expect(() => counterValue(undefined)).toThrow();
    expect(() => counterValue("texto")).toThrow();
  });
});
