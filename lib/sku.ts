import type { Prisma } from "@/generated/prisma/client";
export const SKU_PATTERN = /^[A-Z]\d{3,5}$/;
export function isValidSku(value: string) {
  return SKU_PATTERN.test(value);
}
export async function nextSku(tx: Prisma.TransactionClient) {
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext('elitepc-sku'))::text`;
  const configured = (await tx.configuracion.findUnique({ where: { clave: "prefijoSku" } }))?.valor;
  const prefix = typeof configured === "string" && /^[A-Z]$/.test(configured) ? configured : "Z";
  const [row] = await tx.$queryRaw<
    { max: number | null }[]
  >`SELECT MAX(substring(sku FROM 2)::int) AS max FROM "Producto" WHERE sku ~ '^[A-Z][0-9]{3,5}$' AND left(sku,1)=${prefix}`;
  const number = (row?.max || 0) + 1;
  if (number > 99999) throw new Error("No quedan códigos SKU libres con este prefijo");
  return `${prefix}${String(number).padStart(4, "0")}`;
}
