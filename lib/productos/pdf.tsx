import "server-only";
import { Document, Page, View, Text, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { formatAmount } from "@/lib/precios";
import type { QuoteItem } from "@/lib/cotizaciones";
const styles = StyleSheet.create({
  page: { padding: 34, fontFamily: "Helvetica", fontSize: 9, color: "#152039" },
  header: { borderBottomWidth: 2, borderColor: "#7550bd", paddingBottom: 12, marginBottom: 20 },
  logo: { fontSize: 23, fontFamily: "Helvetica-Bold", color: "#55369b" },
  title: { fontSize: 16, fontFamily: "Helvetica-Bold", marginBottom: 8 },
  sku: { fontSize: 9, color: "#617087", marginBottom: 12 },
  image: { width: 220, height: 150, objectFit: "contain", alignSelf: "center", marginBottom: 18 },
  prices: { flexDirection: "row", gap: 20, marginBottom: 14 },
  price: { fontSize: 16, fontFamily: "Helvetica-Bold" },
  oldPrice: { fontSize: 10, textDecoration: "line-through", color: "#627089" },
  highlights: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 14 },
  highlight: {
    backgroundColor: "#eff0f8",
    padding: 9,
    borderRadius: 5,
    width: "47%",
    fontSize: 10,
  },
  key: { padding: 10, borderWidth: 1, borderColor: "#e0e4ed", marginBottom: 8 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#e1e6ed", paddingVertical: 6 },
  label: { width: "35%", fontFamily: "Helvetica-Bold" },
  value: { width: "65%" },
  footer: { position: "absolute", bottom: 20, left: 34, right: 34, fontSize: 8, color: "#617087" },
});
function Sheet({ item, now }: { item: QuoteItem; now: number }) {
  const p = item.producto;
  const active =
    p.precioOferta &&
    (!p.ofertaDesde || Date.parse(p.ofertaDesde) <= now) &&
    (!p.ofertaHasta || Date.parse(p.ofertaHasta) >= now);
  return (
    <View>
      <Text style={styles.title}>{p.titulo}</Text>
      <Text style={styles.sku}>
        {p.sku} · Cantidad: {item.cantidad}
      </Text>
      {p.imagenes[0] && <Image style={styles.image} src={p.imagenes[0].url} />}
      <View style={styles.prices}>
        {p.precioSinFactura && (
          <View>
            <Text>SIN FACTURA</Text>
            <Text style={active ? styles.oldPrice : styles.price}>
              {formatAmount(p.precioSinFactura)}
            </Text>
            {active && <Text style={styles.price}>{formatAmount(p.precioOferta)}</Text>}
          </View>
        )}
        {p.precioConFactura && (
          <View>
            <Text>CON FACTURA</Text>
            <Text style={styles.price}>{formatAmount(p.precioConFactura)}</Text>
          </View>
        )}
      </View>
      <View style={styles.highlights}>
        {p.destacados.slice(0, 4).map((v, i) => (
          <View key={i} style={styles.highlight}>
            <Text>{v.texto}</Text>
          </View>
        ))}
      </View>
      {p.puntosClave
        .filter((v) => v.enPdf)
        .map((v, i) => (
          <View key={i} style={styles.key}>
            <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 5 }}>{v.titulo}</Text>
            <Text>{v.descripcion}</Text>
          </View>
        ))}
      {p.specs.map((v, i) => (
        <View key={i} style={styles.row} wrap={false}>
          <Text style={styles.label}>{v.campo}</Text>
          <Text style={styles.value}>{v.valor}</Text>
        </View>
      ))}
    </View>
  );
}
export async function productPdf(
  items: QuoteItem[],
  code = "Ficha de producto",
  client?: string | null,
) {
  const now = Date.now();
  return renderToBuffer(
    <Document title={`${code} · ElitePC`} author="ElitePC">
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.logo}>elitepc</Text>
          <Text>Santa Cruz de la Sierra · Bolivia</Text>
          <Text>
            {code}
            {client ? ` · ${client}` : ""}
          </Text>
        </View>
        {items.map((item, index) => (
          <View key={item.productoId} break={index > 0}>
            <Sheet item={item} now={now} />
          </View>
        ))}
        <Text style={styles.footer} fixed>
          ElitePC · Precios en bolivianos · S/F: sin factura · C/F: con factura
        </Text>
      </Page>
    </Document>,
  );
}
