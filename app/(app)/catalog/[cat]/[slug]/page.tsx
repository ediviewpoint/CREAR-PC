import { formatBob } from "@/lib/utils/format";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCatalog } from "@/lib/catalog/load";
import { ProductZoom } from "@/components/catalog/ProductZoom";
import { Benchmarks } from "@/components/catalog/Benchmarks";
import { CATEGORIES } from "@/lib/catalog/types";
import { PreviewBrand } from "@/components/build/PreviewBrand";
type Props = { params: Promise<{ cat: string; slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { cat, slug } = await params;
  const c = (await getCatalog()).find((c) => c.category === cat && c.slug === slug);
  return { title: c?.name ?? "Componente no disponible" };
}
export default async function ProductPage({ params }: Props) {
  const { cat, slug } = await params;
  const c = (await getCatalog()).find((c) => c.category === cat && c.slug === slug);
  if (!c) notFound();
  return (
    <main id="main" className="shell page-section">
      <Link href="/catalog" className="text-link">
        ← Todos los componentes
      </Link>
      <section className="product-detail">
        <ProductZoom component={c} />
        <div>
          <PreviewBrand component={c} large />
          <p className="eyebrow">
            {c.brand} / {CATEGORIES.find((category) => category.key === c.category)?.label}
          </p>
          <h1>{c.name}</h1>
          <div className="spec-pills">
            {c.specs.slice(0, 3).map((s) => (
              <span key={s.label}>{s.value}</span>
            ))}
          </div>
          <p className="page-intro">
            La ficha técnica, sin ruido. Revisá las especificaciones antes de sumarlo a tu build.
          </p>
          <div className="warranty-note">
            <span className="eyebrow">Garantía comercial ELITEPC</span>
            <strong>{c.category === "cpu" ? "12 meses" : "3 meses"}</strong>
            <p>
              Para compras a ELITEPC. Se conservan los derechos legales y las coberturas adicionales
              aplicables.
            </p>
          </div>
          <p className="price-heading">
            {c.priceBob === null ? "Precio por cotizar" : formatBob(c.priceBob)}
          </p>
          <Link className="button" href={`/build?component=${c.slug}`}>
            Usar en mi build ↗
          </Link>
        </div>
      </section>
      <div className="product-assurance">
        <span className="eyebrow">Antes de sumar esta pieza</span>
        <p>
          Verificá el modelo exacto y la garantía escrita del vendedor. El configurador revisa
          compatibilidad con los datos disponibles.
        </p>
        <Link className="text-link small" href="/politicas/garantia">
          Consultar garantía ↗
        </Link>
      </div>
      <section className="detail-section">
        <p className="eyebrow">01 / Especificaciones</p>
        <h2>Lo que necesitás saber.</h2>
        <dl className="spec-table">
          {c.specs.map((s) => (
            <div key={s.label}>
              <dt>{s.label}</dt>
              <dd className="mono">{s.value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="detail-section">
        <p className="eyebrow">02 / Rendimiento</p>
        <h2>Medido, cuando hay datos.</h2>
        <Benchmarks data={c.benchmarks} />
      </section>
      <section className="detail-section">
        <p className="eyebrow">03 / Trazabilidad</p>
        <h2>Fuentes de la ficha.</h2>
        <ul className="sources">
          {c.sources.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noreferrer">
                {new URL(s.url).hostname} ↗
              </a>
              {s.fetchedAt && (
                <span className="small muted"> · Consulta: {s.fetchedAt.slice(0, 10)}</span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
