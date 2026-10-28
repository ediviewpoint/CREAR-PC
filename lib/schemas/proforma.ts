import { z } from "zod";

export const clientInfo = z.object({
  name: z.string().min(1).max(160),
  ciNit: z
    .string()
    .trim()
    .max(40)
    .regex(/^[0-9A-Za-z\-\.]*$/, "Caracteres inválidos")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .max(40)
    .regex(/^[+\d\s\-()]*$/, "Teléfono inválido")
    .optional()
    .or(z.literal("")),
  email: z.string().email().max(160).optional().or(z.literal("")),
});

export const createProformaInput = z.object({
  buildId: z.string().uuid(),
  client: clientInfo,
  discountBob: z.number().nonnegative().max(500000).default(0),
  validityDays: z.number().int().min(1).max(30).default(7),
  notes: z.string().max(1000).optional(),
});

export type CreateProformaInput = z.infer<typeof createProformaInput>;
export type ClientInfo = z.infer<typeof clientInfo>;

/**
 * Formato del código: PRO-YYYY-NNNNN
 * YYYY = año de emisión
 * NNNNN = correlativo cinco dígitos, reinicia cada año
 */
export const proformaCode = z.string().regex(/^PRO-\d{4}-\d{5}$/, "Código de proforma inválido");
