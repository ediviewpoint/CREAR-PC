import { elitepcLogo } from "@/lib/brand-asset";
/* eslint-disable jsx-a11y/alt-text -- React PDF Image is not HTML; its accessible equivalent is in ProformaReadable. */
import { Document, Page, View, Text, Font, StyleSheet, Image } from "@react-pdf/renderer";
import type { ProformaData } from "@/lib/proforma/types";
import { proformaTotals, formatDate } from "@/lib/proforma/types";
import { formatBob } from "@/lib/utils/format";
const fontBases = new Set<string>();
export function registerProformaFonts(base = "/fonts") {
  if (fontBases.has(base)) return;
  Font.register({
    family: "Inter",
    fonts: [
      { src: `${base}/inter-regular.woff`, fontWeight: 400 },
      { src: `${base}/inter-semibold.woff`, fontWeight: 600 },
    ],
  });
  Font.register({ family: "JetBrains Mono", src: `${base}/jetbrains-mono-regular.woff` });
  Font.registerHyphenationCallback((word) => [word]);
  fontBases.add(base);
}
const s = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingHorizontal: 36,
    paddingBottom: 48,
    fontFamily: "Inter",
    fontSize: 10,
    color: "#050F24",
    lineHeight: 1.5,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF1F5",
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 8 },
  wordmark: { fontSize: 20, fontWeight: 600, letterSpacing: -0.5 },
  meta: { textAlign: "right", fontSize: 9 },
  caption: { fontSize: 8, color: "#4A5A75", letterSpacing: 1, marginBottom: 6 },
  code: { fontFamily: "JetBrains Mono", fontSize: 10, marginBottom: 6 },
  parties: { flexDirection: "row", gap: 24, marginTop: 16, marginBottom: 16 },
  party: { width: "50%" },
  notice: { fontSize: 9, color: "#13284A", backgroundColor: "#F7F8FA", padding: 8, marginTop: 12 },
  tableHead: {
    flexDirection: "row",
    backgroundColor: "#13284A",
    color: "#FFFFFF",
    fontSize: 8,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  rowCompact: { paddingVertical: 4, fontSize: 9, lineHeight: 1.3 },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#EEF1F5",
    paddingVertical: 8,
    paddingHorizontal: 6,
    fontSize: 9,
  },
  num: { width: "5%" },
  category: { width: "17%", paddingRight: 6 },
  model: { width: "27%", paddingRight: 8 },
  qty: { width: "7%", textAlign: "right" },
  price: { width: "22%", textAlign: "right", fontFamily: "JetBrains Mono", fontSize: 9 },
  totals: { width: 250, alignSelf: "flex-end", marginTop: 16 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  totalFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#13284A",
    paddingTop: 12,
    marginTop: 4,
    fontSize: 14,
    fontWeight: 600,
  },
  conditions: { marginTop: 20, fontSize: 8, color: "#4A5A75" },
  term: { marginBottom: 3 },
  bottom: { marginTop: 16, flexDirection: "row", alignItems: "center", gap: 16 },
  qr: { width: 64, height: 64 },
  url: { fontSize: 8, color: "#4A5A75", maxWidth: 350 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 42,
    right: 42,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#4A5A75",
  },
});
export function ProformaPDF({
  data,
  qrDataUrl,
  url,
}: {
  data: ProformaData;
  qrDataUrl: string;
  url: string;
}) {
  const pending = data.items.some((i) => i.pricePending);
  const t = proformaTotals(data),
    compact = data.items.length > 4;
  return (
    <Document title={`CREAR PC · ${data.code}`} author="CREAR PC" language="es-BO">
      <Page size="LETTER" style={s.page} wrap>
        <View style={[s.header, compact ? { paddingBottom: 8 } : {}]} fixed>
          <View style={s.brand}>
            <Image
              src={elitepcLogo}
              style={{ width: 155, height: 155, marginTop: -49, marginBottom: -48 }}
            />
          </View>
          <View style={s.meta}>
            <Text style={s.caption}>PROFORMA</Text>
            <Text style={s.code}>{data.code}</Text>
            <Text>Emitida: {formatDate(data.issuedAt)}</Text>
            <Text>Válida hasta: {formatDate(data.validUntil)}</Text>
          </View>
        </View>
        {data.example && (
          <Text style={s.notice}>
            EJEMPLO VISUAL - Importes ficticios. No constituye una cotización emitida.
          </Text>
        )}
        {data.draft && (
          <Text style={s.notice}>
            BORRADOR - Sin numeración oficial. Pendiente de emisión por el vendedor.
          </Text>
        )}
        <View style={[s.parties, compact ? { marginTop: 12, marginBottom: 12 } : {}]} wrap={false}>
          <View style={s.party}>
            <Text style={s.caption}>CLIENTE</Text>
            <Text>{data.client.name}</Text>
            <Text>CI/NIT: {data.client.ciNit ?? "No informado"}</Text>
            <Text>Teléfono: {data.client.phone ?? "No informado"}</Text>
          </View>
          <View style={s.party}>
            <Text style={s.caption}>EMISOR</Text>
            <Text>{data.issuer.name}</Text>
            {data.issuer.nit && <Text>NIT: {data.issuer.nit}</Text>}
            <Text>{data.issuer.city}</Text>
            {data.issuer.phone && <Text>{data.issuer.phone}</Text>}
          </View>
        </View>
        <View style={s.tableHead}>
          <Text style={s.num}>#</Text>
          <Text style={s.category}>Categoría</Text>
          <Text style={s.model}>Marca / modelo</Text>
          <Text style={s.qty}>Cant.</Text>
          <Text style={s.price}>P. unitario Bs.</Text>
          <Text style={s.price}>Importe Bs.</Text>
        </View>
        {data.items.map((item, i) => (
          <View key={i} style={[s.row, compact ? s.rowCompact : {}]} wrap={false}>
            <Text style={s.num}>{i + 1}</Text>
            <Text style={s.category}>{item.category}</Text>
              <Text style={s.model}>{item.name}{item.warranty?`\nGarantía: ${item.warranty}`:""}</Text>
            <Text style={s.qty}>{item.quantity}</Text>
            <Text style={s.price}>
              {item.pricePending ? "Por cotizar" : formatBob(item.unitPriceBob)}
            </Text>
            <Text style={s.price}>
              {item.pricePending ? "Por cotizar" : formatBob(item.quantity * item.unitPriceBob)}
            </Text>
          </View>
        ))}
        <View style={s.totals} wrap={false}>
          <View style={s.totalRow}>
            <Text>Subtotal</Text>
            <Text>{pending ? "Por cotizar" : formatBob(t.subtotal)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text>Descuento</Text>
            <Text>{formatBob(t.discount)}</Text>
          </View>
          <View style={s.totalFinal}>
            <Text>TOTAL</Text>
            <Text>{pending ? "Por cotizar" : formatBob(t.total)}</Text>
          </View>
        </View>
        <View
          style={[s.conditions, compact ? { marginTop: 16, lineHeight: 1.3 } : {}]}
          wrap={false}
        >
          <Text style={s.caption}>CONDICIONES</Text>
          {data.terms.map((term, i) => (
            <Text key={i} style={[s.term, compact ? { marginBottom: 1 } : {}]}>
              - {term}
            </Text>
          ))}
        </View>
        <View style={[s.bottom, compact ? { marginTop: 12 } : {}]} wrap={false}>
          {!data.draft && (
            <Image src={qrDataUrl} style={[s.qr, compact ? { width: 56, height: 56 } : {}]} />
          )}
          <View>
            <Text>{data.draft ? "Borrador para revisión" : "Consultá la versión web"}</Text>
            <Text style={s.url}>
              {data.draft
                ? "Sin enlace público. Los precios pendientes deben confirmarse antes de emitir."
                : url}
            </Text>
          </View>
        </View>
        <Text
          fixed
          style={{ position: "absolute", bottom: 22, left: 36, fontSize: 8, color: "#4A5A75" }}
        >
          CREAR PC / Cotización no fiscal
        </Text>
      </Page>
    </Document>
  );
}
