import { z } from "zod";
export const proformaSchema = z
  .object({
    id: z.string().min(1).max(100),
    code: z.string().regex(/^(BORRADOR|PRO-\d{4}-\d{5})$/),
    draft: z.boolean(),
    example: z.boolean(),
    name: z.string().max(160),
    client: z.object({
      name: z.string().min(1).max(160),
      ciNit: z.string().max(40).optional(),
      phone: z.string().max(40).optional(),
    }),
    issuer: z.object({
      name: z.string().min(1).max(160),
      city: z.string().max(160),
      nit: z.string().max(40).optional(),
      phone: z.string().max(40).optional(),
    }),
    issuedAt: z.iso.date(),
    validUntil: z.iso.date(),
    items: z
      .array(
        z.object({
          category: z.string().max(80),
          name: z.string().max(180),
          quantity: z.number().int().min(1).max(99),
          unitPriceBob: z.number().finite().min(0).max(1000000),
          pricePending: z.boolean().optional(),
          componentId: z.uuid().optional(),
          storeName: z.string().max(120).optional(),
          sourceUrl: z.url().optional(),
          observedAt: z.iso.datetime().optional(),
          specs: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
        }),
      )
      .min(1)
      .max(100),
    discountBob: z.number().finite().min(0),
    terms: z.array(z.string().max(600)).max(15),
  })
  .refine((d) => d.draft || !d.items.some((i) => i.pricePending), {
    message: "Una proforma emitida no admite precios pendientes.",
  })
  .refine((d) => d.discountBob <= d.items.reduce((s, i) => s + i.quantity * i.unitPriceBob, 0), {
    message: "El descuento supera el subtotal.",
  });
export type ProformaData = z.infer<typeof proformaSchema>;
export function proformaTotals(data: ProformaData) {
  const subtotalCents = data.items.reduce(
    (s, i) => s + Math.round(i.unitPriceBob * 100) * i.quantity,
    0,
  );
  const discountCents = Math.round(data.discountBob * 100);
  return {
    subtotal: subtotalCents / 100,
    discount: discountCents / 100,
    total: (subtotalCents - discountCents) / 100,
  };
}
export function formatDate(date: string) {
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}
