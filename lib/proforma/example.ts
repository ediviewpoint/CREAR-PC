import type { ProformaData } from "./types";
/** Explicit visual fixture. These are not market prices or a real issued quote. */
export const exampleProforma: ProformaData = {
  id: "ejemplo",
  code: "PRO-2026-00001",
  draft: false,
  example: true,
  name: "Equipo de ejemplo",
  client: { name: "Cliente de ejemplo", ciNit: "No informado", phone: "No informado" },
  issuer: { name: "ELITEPC · Emisor de ejemplo", city: "Santa Cruz, Bolivia" },
  issuedAt: "2026-10-28",
  validUntil: "2026-11-04",
  items: [
    { category: "Procesador", name: "Procesador de muestra", quantity: 1, unitPriceBob: 1800 },
    { category: "Memoria", name: "Kit de memoria de muestra", quantity: 2, unitPriceBob: 450 },
    {
      category: "Almacenamiento",
      name: "Unidad de almacenamiento de muestra",
      quantity: 1,
      unitPriceBob: 650,
    },
  ],
  discountBob: 150,
  terms: [
    "Precios en Bolivianos. Sujetos a disponibilidad de stock.",
    "Validez: 7 días calendario desde la emisión.",
    "No es factura. No habilita crédito fiscal.",
    "Montaje y entrega no incluidos salvo indicación expresa.",
    "ELITEPC: piezas 3 meses; procesador 12 meses. Sin limitar derechos legales ni garantías adicionales aplicables.",
  ],
};
