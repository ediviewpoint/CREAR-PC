import type { ProductInput } from "./schema";
export function autoTitle(
  product: Pick<ProductInput, "marca" | "modelo" | "partNumber" | "specs">,
  template?: string | null,
) {
  const processor =
    product.specs
      .find((s) => /procesador/i.test(s.campo))
      ?.valor.replace(/^Intel\s+|^AMD\s+/i, "") || "";
  const screen =
    product.specs
      .find((s) => s.campo.toLowerCase() === "pantalla")
      ?.valor.match(/[\d]+(?:\.\d+)?/)?.[0] || "";
  const values: Record<string, string> = {
    MARCA: product.marca,
    MODELO: product.modelo,
    PART_NUMBER: product.partNumber,
    PROCESADOR_CORTO: processor,
    PANTALLA: screen,
  };
  return (template || "{MARCA} {MODELO} ({PART_NUMBER})")
    .replace(/\{(\w+)\}/g, (_, key) => values[key] || "")
    .replace(/\(\s*\)/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase()
    .slice(0, 160);
}
