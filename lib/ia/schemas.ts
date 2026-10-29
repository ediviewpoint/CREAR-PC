import { z } from "zod";
export const Conf = z.enum(["alta", "media", "baja"]);
const Campo = <T extends z.ZodType>(type: T) =>
  z.object({ valor: type.nullable(), confianza: Conf.nullable() });
export const ExtraccionSchema = z.object({
  sku: Campo(z.string()),
  marca: Campo(z.string()),
  modelo: Campo(z.string()),
  partNumber: Campo(z.string()),
  categoria: Campo(z.string()),
  subcategoria: Campo(z.string()),
  color: Campo(z.string()),
  condicion: Campo(z.enum(["NUEVO", "REACONDICIONADO", "OPEN_BOX", "USADO"])),
  garantia: Campo(z.string()),
  precio: z.object({
    moneda: z.enum(["BOB", "USD"]).nullable(),
    sinFactura: Campo(z.number().nonnegative()),
    conFactura: Campo(z.number().nonnegative()),
    oferta: Campo(z.number().nonnegative()),
    otrosPrecios: z.array(
      z.object({
        monto: z.number(),
        moneda: z.enum(["BOB", "USD"]),
        etiqueta: z.string().nullable(),
      }),
    ),
  }),
  disponibilidad: Campo(z.enum(["EN_STOCK", "SIN_STOCK", "BAJO_PEDIDO"])),
  stock: Campo(z.number().int().nonnegative()),
  specs: z
    .array(
      z.object({ campo: z.string(), valor: z.string(), confianza: Conf, evidencia: z.string() }),
    )
    .max(100),
  imagenesUrl: z.array(z.url()),
  etiquetasSugeridas: z.array(z.string()).max(6),
  avisos: z.array(z.string()),
});
export const SpecsModeloSchema = z.object({
  encontrado: z.boolean(),
  specs: z.array(
    z.object({
      campo: z.string(),
      valor: z.string(),
      fuenteUrl: z.url().nullable(),
      confianza: Conf,
    }),
  ),
  variantes: z.array(z.object({ nombre: z.string(), diferencias: z.array(z.string()) })),
  sugerencias: z.array(z.string()).max(5),
  fuentes: z.array(z.url()),
});
export const DestacadosSchema = z.object({
  destacados: z
    .array(
      z.object({
        icono: z.enum([
          "rayo",
          "disquete",
          "globo",
          "candado",
          "chip",
          "bateria",
          "pantalla",
          "wifi",
          "escudo",
          "pluma",
        ]),
        texto: z.string().max(40),
      }),
    )
    .max(4),
});
export const PuntosSchema = z.object({
  puntos: z
    .array(z.object({ titulo: z.string().max(80), descripcion: z.string().max(220) }))
    .max(4),
});
export type Extraction = z.infer<typeof ExtraccionSchema>;
