import { z } from "zod";
export const SettingsSchema = z
  .object({
    recargoConFactura: z.number().min(0).max(100),
    redondearDecena: z.boolean(),
    umbralStockBajo: z.number().int().min(0).max(99999),
    limiteDiarioIA: z.number().int().min(1).max(100000),
    prefijoSku: z.string().regex(/^[A-Z]$/),
    plantillaWhatsApp: z.string().min(1).max(5000),
    tipoCambio: z.object({
      valor: z.coerce.number().positive().max(9999),
      fecha: z.iso.datetime().nullable(),
      fuente: z.string().min(1).max(200),
      verificado: z.boolean(),
    }),
  })
  .partial();
export const UserSchema = z.object({
  id: z.string().optional(),
  nombre: z.string().trim().min(1).max(120),
  email: z.email().transform((v) => v.toLowerCase()),
  rol: z.enum(["ADMIN", "EDITOR", "VENDEDOR", "LECTOR"]),
  activo: z.boolean().default(true),
  password: z.string().min(12).max(200).optional(),
});
export const AliasSchema = z.object({
  tipo: z.enum(["marca", "abreviatura"]),
  valor: z.string().trim().min(1).max(100),
  normalizado: z.string().trim().min(1).max(200),
});
