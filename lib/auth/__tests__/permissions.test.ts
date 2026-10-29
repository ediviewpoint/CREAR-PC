import { describe, it, expect } from "vitest";
import { hasPermission, hasRole, redactCost, ROLES } from "@/lib/auth-permissions";
describe("Permisos ElitePC", () => {
  it("protege escritura, IA, costo y eliminación por rol", () => {
    for (const role of ROLES) {
      expect(hasPermission(role, "read")).toBe(true);
      expect(hasPermission(role, "write")).toBe(["ADMIN", "EDITOR"].includes(role));
      expect(hasPermission(role, "ai")).toBe(["ADMIN", "EDITOR"].includes(role));
      expect(hasPermission(role, "availability")).toBe(role !== "LECTOR");
      expect(hasPermission(role, "cost")).toBe(role === "ADMIN");
      expect(hasPermission(role, "delete")).toBe(role === "ADMIN");
    }
    expect(hasRole("LECTOR", "EDITOR")).toBe(false);
  });
  it("elimina costo de la respuesta para cuentas sin permiso", () => {
    const product = {
      titulo: "Monitor",
      costo: 10000,
      monedaCosto: "BOB",
      precioSinFactura: 15000,
    };
    expect(redactCost(product, "EDITOR")).toEqual({ titulo: "Monitor", precioSinFactura: 15000 });
    expect(redactCost(product, "ADMIN")).toEqual(product);
    expect(product.costo).toBe(10000);
  });
});
