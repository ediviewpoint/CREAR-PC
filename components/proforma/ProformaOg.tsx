import type { ProformaData } from "@/lib/proforma/types";
import { proformaTotals } from "@/lib/proforma/types";
import { formatBob } from "@/lib/utils/format";
export function ProformaOg({ data }: { data: ProformaData }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#FFFFFF",
        color: "#13284A",
        padding: 64,
        display: "flex",
        flexDirection: "column",
        fontFamily: "Inter",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26 }}>
        <span>CREAR PC /</span>
        <span>{data.code}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", marginTop: 80 }}>
        <span style={{ fontSize: 24 }}>PROFORMA {data.example ? "· EJEMPLO VISUAL" : ""}</span>
        <span style={{ fontSize: 58, marginTop: 24, maxWidth: 1000 }}>
          {data.client.name.slice(0, 80)}
        </span>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginTop: "auto",
          borderTop: "1px solid #EEF1F5",
          paddingTop: 32,
        }}
      >
        <span style={{ fontSize: 24 }}>Santa Cruz · Bolivia</span>
        <span style={{ fontSize: 58 }}>{formatBob(proformaTotals(data).total)}</span>
      </div>
    </div>
  );
}
