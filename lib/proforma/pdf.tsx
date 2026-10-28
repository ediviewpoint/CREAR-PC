import "server-only";
import path from "node:path";
import type { DocumentProps } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import { ProformaPDF, registerProformaFonts } from "@/components/proforma/ProformaPDF";
export type ProformaPdfItem = {
  categoria: string;
  marcaModelo: string;
  cantidad: number;
  precioUnitarioBob: number;
  totalBob: number;
};

export type ProformaPdfData = {
  code: string;
  issuedAt: Date;
  validUntil: Date;
  cliente: {
    nombre: string;
    ciNit?: string | null;
    telefono?: string | null;
    email?: string | null;
  };
  emisor: {
    nombre: string;
    nit?: string | null;
    ciudad: string;
    telefono?: string | null;
  };
  items: ProformaPdfItem[];
  subtotalBob: number;
  descuentoBob: number;
  totalBob: number;
  terms: string;
  qrDataUrl?: string | null;
  siteUrl: string;
};

export function ProformaDocument(data: ProformaPdfData): ReactElement<DocumentProps> {
  registerProformaFonts(path.join(process.cwd(), "public/fonts"));
  return ProformaPDF({
    data: {
      id: "document",
      code: data.code,
      draft: false,
      example: false,
      name: "Proforma",
      client: {
        name: data.cliente.nombre,
        ...(data.cliente.ciNit ? { ciNit: data.cliente.ciNit } : {}),
        ...(data.cliente.telefono ? { phone: data.cliente.telefono } : {}),
      },
      issuer: {
        name: data.emisor.nombre,
        city: data.emisor.ciudad,
        ...(data.emisor.nit ? { nit: data.emisor.nit } : {}),
      },
      issuedAt: data.issuedAt.toISOString().slice(0, 10),
      validUntil: data.validUntil.toISOString().slice(0, 10),
      items: data.items.map((i) => ({
        category: i.categoria,
        name: i.marcaModelo,
        quantity: i.cantidad,
        unitPriceBob: i.precioUnitarioBob,
      })),
      discountBob: data.descuentoBob,
      terms: data.terms.split("\n").filter(Boolean),
    },
    qrDataUrl: data.qrDataUrl ?? "",
    url: data.siteUrl,
  });
}
