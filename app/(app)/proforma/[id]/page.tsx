import { notFound } from "next/navigation";
import type { Metadata } from "next";
import QRCode from "qrcode";
import { getPublicProforma, getAccessibleProforma, proformaUrl } from "@/lib/proforma/load";
import { ProformaReadable } from "@/components/proforma/ProformaReadable";
import { LocalProforma } from "@/components/proforma/LocalProforma";
type Props = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await getPublicProforma(id);
  if (!data) return { title: "Borrador de proforma", robots: { index: false, follow: false } };
  return {
    title: `Proforma ${data.code}`,
    robots: { index: false, follow: false },
    openGraph: {
      type: "website",
      title: `Proforma ${data.code} · CREAR PC`,
      images: [
        { url: `/api/og/proforma/${id}`, width: 1200, height: 630, alt: "Proforma CREAR PC" },
      ],
    },
    twitter: { card: "summary_large_image", images: [`/api/og/proforma/${id}`] },
  };
}
export default async function ProformaPage({ params }: Props) {
  const { id } = await params;
  if (id === "local")
    return (
      <main id="main" className="shell page-section">
        <p className="eyebrow">Tu documento / Borrador local</p>
        <h1>Todo, por escrito.</h1>
        <LocalProforma />
      </main>
    );
  const data = await getAccessibleProforma(id);
  if (!data) notFound();
  const url = proformaUrl(id),
    qr = await QRCode.toDataURL(url, {
      width: 256,
      margin: 4,
      color: { dark: "#13284A", light: "#FFFFFF" },
    });
  return (
    <main id="main" className="shell page-section">
      <p className="eyebrow">Tu documento / Proforma</p>
      <h1>Todo, por escrito.</h1>
      {data.example && (
        <p className="page-intro">
          Ejemplo visual con importes ficticios. No es una cotización de mercado.
        </p>
      )}
      <div className="proforma-toolbar">
        <a className="button" href={`/api/proforma/${id}/pdf`} download>
          Descargar PDF ↗
        </a>
        <span className="small muted">Carta · 215,9 × 279,4 mm</span>
      </div>
      <iframe
        className="proforma-frame"
        src={`/api/proforma/${id}/pdf?inline=1`}
        title="Vista exacta del PDF de la proforma"
      />
      <details className="proforma-readable" open>
        <summary>Contenido accesible de la proforma</summary>
        <ProformaReadable data={data} qrDataUrl={qr} url={url} />
      </details>
    </main>
  );
}
