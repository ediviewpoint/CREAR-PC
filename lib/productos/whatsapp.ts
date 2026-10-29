import "server-only";
import { prisma } from "@/lib/prisma";
import { formatAmount } from "@/lib/precios";
import { getProduct } from "./guardar";
export async function whatsappText(id: string) {
  const p = await getProduct(id, "VENDEDOR");
  const configured = (
    await prisma.configuracion.findUnique({ where: { clave: "plantillaWhatsApp" } })
  )?.valor;
  const template =
    typeof configured === "string"
      ? configured
      : "{SKU} {TITULO}\n{DESTACADO_1}\n{DESTACADO_2}\n{DESTACADO_3}\n{DESTACADO_4}\nPrecio: {PRECIO_SF} S/F{SI_CF: | {PRECIO_CF} C/F}\nElitePC · Santa Cruz";
  const active =
    p.precioOferta &&
    (!p.ofertaDesde || Date.parse(p.ofertaDesde) <= Date.now()) &&
    (!p.ofertaHasta || Date.parse(p.ofertaHasta) >= Date.now());
  const values: Record<string, string> = {
    SKU: p.sku,
    TITULO: p.titulo,
    PRECIO_SF: p.precioSinFactura
      ? formatAmount(active ? p.precioOferta : p.precioSinFactura).replace(/^Bs/, "")
      : "Consultar",
    PRECIO_CF: p.precioConFactura ? formatAmount(p.precioConFactura).replace(/^Bs/, "") : "",
    ...Object.fromEntries(
      Array.from({ length: 4 }, (_, i) => [`DESTACADO_${i + 1}`, p.destacados[i]?.texto || ""]),
    ),
  };
  const source = !p.precioSinFactura
    ? template
        .split("\n")
        .map((line) =>
          line.includes("{PRECIO_SF}")
            ? p.precioConFactura
              ? "Precio: " + formatAmount(p.precioConFactura) + " C/F"
              : "Precio: consultar"
            : line,
        )
        .join("\n")
    : template;
  return source
    .replace(/\{SI_CF:\s*([^}]*\{PRECIO_CF\}[^}]*)\}/g, (_, part) =>
      p.precioConFactura ? part : "",
    )
    .replace(/\{([A-Z_0-9]+)\}/g, (_, key) => values[key] || "")
    .split("\n")
    .filter((v) => v.trim())
    .join("\n");
}
