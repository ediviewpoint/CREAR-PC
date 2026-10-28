import "server-only";
import QRCode from "qrcode";
import { getAccessibleProforma, proformaUrl } from "./load";
import { proformaTotals } from "./types";
import type { ProformaPdfData } from "./pdf";
export async function buildProformaPdfData(id: string): Promise<ProformaPdfData | null> {
  const data = await getAccessibleProforma(id);
  if (!data) return null;
  const t = proformaTotals(data),
    url = proformaUrl(id);
  return {
    code: data.code,
    issuedAt: new Date(data.issuedAt + "T00:00:00Z"),
    validUntil: new Date(data.validUntil + "T00:00:00Z"),
    cliente: { nombre: data.client.name, ciNit: data.client.ciNit, telefono: data.client.phone },
    emisor: {
      nombre: data.issuer.name,
      ciudad: data.issuer.city,
      nit: data.issuer.nit,
      telefono: data.issuer.phone,
    },
    items: data.items.map((i) => ({
      categoria: i.category,
      marcaModelo: i.name,
      cantidad: i.quantity,
      precioUnitarioBob: i.unitPriceBob,
      totalBob: i.quantity * i.unitPriceBob,
    })),
    subtotalBob: t.subtotal,
    descuentoBob: t.discount,
    totalBob: t.total,
    terms: data.terms.join("\n"),
    qrDataUrl: await QRCode.toDataURL(url, {
      margin: 4,
      width: 256,
      color: { dark: "#13284A", light: "#FFFFFF" },
    }),
    siteUrl: url,
  };
}
