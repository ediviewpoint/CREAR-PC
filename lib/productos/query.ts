import { z } from "zod";
export function searchPriceCents(value: string): number | null {
  let text = value
    .trim()
    .replace(/^(?:bs\.?|bob|\$us|usd)\s*/i, "")
    .replace(/\s/g, "");
  if (!/^\d+(?:[.,]\d+)*$/.test(text)) return null;
  if (text.includes(",") && text.includes(".")) {
    const decimal = text.lastIndexOf(",") > text.lastIndexOf(".") ? "," : ".";
    text = text.replace(decimal === "," ? /\./g : /,/g, "").replace(decimal, ".");
  } else if (/[.,]\d{3}(?:[.,]\d{3})*$/.test(text)) text = text.replace(/[.,]/g, "");
  else text = text.replace(",", ".");
  const number = Number(text);
  return Number.isFinite(number) && number >= 0 && number <= 21474836.47
    ? Math.round(number * 100)
    : null;
}
const flag = z.enum(["true", "false"]).optional();
const price = z
  .string()
  .refine((v) => searchPriceCents(v) !== null, "Precio inválido")
  .optional();
export const ProductQuerySchema = z
  .object({
    q: z.string().trim().max(160).default(""),
    categoria: z.string().max(100).optional(),
    subcategoria: z.string().max(100).optional(),
    marca: z.string().max(100).optional(),
    etiqueta: z.string().max(100).optional(),
    disponibilidad: z.enum(["EN_STOCK", "SIN_STOCK", "BAJO_PEDIDO", "STOCK_BAJO"]).optional(),
    tipo: z.enum(["CARRITO", "IMAGEN"]).optional(),
    escondido: flag,
    revision: flag,
    sinImagen: flag,
    precioMin: price,
    precioMax: price,
    orden: z
      .enum([
        "manual",
        "titulo",
        "categoria",
        "subcategoria",
        "precioSinFactura",
        "precioConFactura",
        "precioUsd",
        "tipo",
        "disponibilidad",
        "createdAt",
      ])
      .default("manual"),
    dir: z.enum(["asc", "desc"]).default("asc"),
    page: z.coerce.number().int().min(1).max(100000).default(1),
    pageSize: z.coerce
      .number()
      .refine((n) => [25, 50, 100, 500, 2000].includes(n))
      .default(50),
    sucursal: z.string().max(100).default("todas"),
  })
  .refine(
    (v) =>
      !v.precioMin ||
      !v.precioMax ||
      searchPriceCents(v.precioMin)! <= searchPriceCents(v.precioMax)!,
    { path: ["precioMax"], message: "El máximo debe ser mayor al mínimo" },
  );
export type ProductQuery = z.infer<typeof ProductQuerySchema>;
