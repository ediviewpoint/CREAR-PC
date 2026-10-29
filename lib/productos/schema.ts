import { z } from "zod";
import { SKU_PATTERN } from "@/lib/sku";
const text = z.string().trim();
const amount = z.number().int().positive().max(2147483647).nullable();
export const OriginSchema = z.enum([
  "MANUAL",
  "TEXTO",
  "BUSQUEDA_MODELO",
  "IA_GENERADO",
  "IMPORTACION",
  "BASE_INTERNA",
]);
export const SpecSchema = z.object({
  campo: text.min(1).max(80),
  valor: text.max(2000),
  icono: text.max(40).nullable().optional(),
  origen: OriginSchema.default("MANUAL"),
  confianza: z.enum(["ALTA", "MEDIA", "BAJA"]).nullable().optional(),
  fuenteUrl: z.url().nullable().optional(),
  confirmado: z.boolean().default(true),
});
export const HighlightSchema = z.object({
  icono: text.max(40),
  texto: text.max(40),
  origen: OriginSchema.default("MANUAL"),
});
export const KeyPointSchema = z.object({
  titulo: text.min(1).max(80),
  descripcion: text.max(220),
  enPdf: z.boolean().default(true),
  origen: OriginSchema.default("MANUAL"),
});
export const ProductSchema = z
  .object({
    sku: text.regex(SKU_PATTERN, "SKU inválido. Ejemplo: Z2715"),
    titulo: text
      .min(5)
      .max(160)
      .refine(
        (v) => !/\bAGOTADO\b/i.test(v),
        "El estado agotado se marca en Disponibilidad, no en el título",
      ),
    tituloManual: z.boolean().default(false),
    marca: text.max(80).default(""),
    modelo: text
      .max(120)
      .transform((v) => v.toUpperCase().replace(/\s+/g, " "))
      .default(""),
    partNumber: text.max(100).default(""),
    categoriaId: text.default(""),
    categoriaNombre: text.default(""),
    subcategoriaId: text.nullable().default(null),
    tipo: z.enum(["CARRITO", "IMAGEN"]).default("CARRITO"),
    condicion: z.enum(["NUEVO", "REACONDICIONADO", "OPEN_BOX", "USADO"]).default("NUEVO"),
    color: text.max(80).default(""),
    garantia: text.max(100).default(""),
    proveedorId: text.max(100).nullable().default(null),
    descripcion: z.string().max(30000).default(""),
    precioSinFactura: amount.default(null),
    precioConFactura: amount.default(null),
    precioOferta: amount.default(null),
    precioUsd: amount.default(null),
    precioMayorista: amount.default(null),
    costo: amount.optional(),
    monedaCosto: z.enum(["BOB", "USD"]).nullable().optional(),
    tipoCambioUsado: z.number().positive().max(9999).nullable().default(null),
    ofertaDesde: z.iso.datetime().nullable().default(null),
    ofertaHasta: z.iso.datetime().nullable().default(null),
    etiquetaDescuento: text.max(60).default(""),
    disponibilidad: z.enum(["EN_STOCK", "SIN_STOCK", "BAJO_PEDIDO"]).default("EN_STOCK"),
    controlaInventario: z.boolean().default(false),
    umbralStockBajo: z.number().int().min(0).max(99999).nullable().default(null),
    stocks: z
      .array(z.object({ sucursalId: text.min(1), cantidad: z.number().int().min(0).max(99999) }))
      .max(100)
      .default([]),
    escondido: z.boolean().default(false),
    destacado: z.boolean().default(false),
    slug: text.max(160).default(""),
    requiereRevision: z.boolean().default(false),
    estado: z.enum(["borrador", "publicado", "archivado"]).default("publicado"),
    textoFuente: z.string().max(20000).nullable().default(null),
    specs: z.array(SpecSchema).max(100).default([]),
    imagenes: z
      .array(
        z.object({
          url: z.url(),
          urlMiniatura: z.url(),
          alt: text.max(200).nullable().default(null),
          ancho: z.number().int().positive().nullable().optional(),
          alto: z.number().int().positive().nullable().optional(),
        }),
      )
      .max(10)
      .default([]),
    destacados: z.array(HighlightSchema).max(6).default([]),
    puntosClave: z.array(KeyPointSchema).max(4).default([]),
    etiquetas: z.array(text.min(1).max(60)).max(40).default([]),
    gruposOpciones: z
      .array(
        z.object({
          nombre: text.min(1).max(80),
          obligatorio: z.boolean(),
          multiple: z.boolean(),
          opciones: z
            .array(
              z.object({
                nombre: text.min(1).max(80),
                ajustePrecio: z.number().int().min(-2147483647).max(2147483647),
              }),
            )
            .max(30),
        }),
      )
      .max(10)
      .default([]),
    updatedAt: z.iso.datetime().optional(),
  })
  .superRefine((v, ctx) => {
    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });
    if (v.estado !== "borrador") {
      if (!v.categoriaId) issue("categoriaId", "Elige una categoría");
      if (v.tipo === "CARRITO") {
        if (!v.marca) issue("marca", "Elige o crea una marca");
        if (["NOTEBOOK", "GAMER"].includes(v.categoriaNombre) && !v.modelo)
          issue("modelo", "Falta el modelo");
        if (!v.precioSinFactura && !v.precioConFactura)
          issue("precioSinFactura", "Ingresa al menos un precio");
      }
    }
    if (v.precioSinFactura && v.precioConFactura && v.precioConFactura < v.precioSinFactura)
      issue("precioConFactura", "El precio con factura no puede ser menor que sin factura");
    if (v.precioOferta && (!v.precioSinFactura || v.precioOferta >= v.precioSinFactura))
      issue("precioOferta", "La oferta debe ser menor al precio normal");
    if (v.ofertaDesde && v.ofertaHasta && v.ofertaHasta < v.ofertaDesde)
      issue("ofertaHasta", "La fecha final debe ser posterior al inicio");
    const fields = new Set<string>();
    for (const [i, spec] of v.specs.entries()) {
      if (!spec.valor.trim()) continue;
      const key = spec.campo.toLowerCase();
      if (fields.has(key))
        ctx.addIssue({
          code: "custom",
          path: ["specs", i, "campo"],
          message: "Este campo ya está en la lista",
        });
      fields.add(key);
    }
    if (new Set(v.stocks.map((s) => s.sucursalId)).size !== v.stocks.length)
      issue("stocks", "Hay sucursales repetidas");
  });
export type ProductInput = z.infer<typeof ProductSchema>;
export function emptyProduct(): ProductInput {
  return ProductSchema.parse({ sku: "Z0001", titulo: "Nuevo producto", estado: "borrador" });
}
