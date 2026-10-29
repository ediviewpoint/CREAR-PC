import { z } from "zod";
import { parseAmount } from "./precios";
export const importFields = [
  "ignorar",
  "sku",
  "titulo",
  "marca",
  "modelo",
  "categoria",
  "precioSinFactura",
  "precioConFactura",
  "precioUsd",
  "costo",
  "stock",
  "sucursal",
  "etiquetas",
  "imagen",
] as const;
export const MappingSchema = z.record(z.string(), z.enum(importFields));
export function suggestMapping(columns: string[]) {
  return Object.fromEntries(
    columns.map((column) => {
      const key = column
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
      const field = /^(cod|codigo|sku)$/.test(key)
        ? "sku"
        : /titulo|nombre|producto|descripcion/.test(key)
          ? "titulo"
          : /marca/.test(key)
            ? "marca"
            : /modelo/.test(key)
              ? "modelo"
              : /categoria/.test(key)
                ? "categoria"
                : /usd|dolar/.test(key)
                  ? "precioUsd"
                  : /costo/.test(key)
                    ? "costo"
                    : /factura|c\/f/.test(key)
                      ? "precioConFactura"
                      : /precio|p.? venta|bob|boliviano/.test(key)
                        ? "precioSinFactura"
                        : /stock|cantidad|existencia/.test(key)
                          ? "stock"
                          : /sucursal/.test(key)
                            ? "sucursal"
                            : /etiqueta|tag/.test(key)
                              ? "etiquetas"
                              : /imagen|foto/.test(key)
                                ? "imagen"
                                : "ignorar";
      return [column, field];
    }),
  );
}
export function mappedRow(row: Record<string, unknown>, mapping: Record<string, string>) {
  const result: Record<string, unknown> = {};
  for (const [column, field] of Object.entries(mapping)) {
    if (field === "ignorar" || row[column] == null || row[column] === "") continue;
    const value = String(row[column]).trim();
    if (["precioSinFactura", "precioConFactura", "precioUsd", "costo"].includes(field))
      result[field] =
        typeof row[column] === "number"
          ? Math.round(Number(row[column]) * 100)
          : parseAmount(value);
    else if (field === "stock") result.stock = Number(value);
    else if (field === "etiquetas")
      result.etiquetas = value
        .split(/[,;]/)
        .map((v) => v.trim())
        .filter(Boolean);
    else result[field] = field === "sku" ? value.toUpperCase() : value;
  }
  return result;
}
