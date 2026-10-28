import type { Metadata } from "next";
import Link from "next/link";
import { getCatalog } from "@/lib/catalog/load";
import { CatalogGrid } from "@/components/catalog/CatalogGrid";
export const metadata: Metadata = {
  title: "Componentes",
  description:
    "Ocho piezas para empezar a armar tu PC. Especificaciones claras y precios identificados en Bolivianos.",
};
export default async function CatalogPage() {
  const components = await getCatalog();
  return (
    <main id="main" className="shell page-section catalog-page">
      <header className="catalog-masthead">
        <div>
          <p className="eyebrow">La colección / CREAR PC</p>
          <h1>
            Buenas piezas.
            <br />
            <span>Mejores decisiones.</span>
          </h1>
        </div>
        <div className="catalog-masthead__aside">
          <p>
            Tu próxima PC, pieza por pieza. Explorá las especificaciones y llevá lo que encaja a tu
            mesa de trabajo.
          </p>
          <Link className="text-link" href="/build">
            Abrir configurador ↗
          </Link>
        </div>
      </header>
      <div className="catalog-context">
        <span className="mono">{String(components.length).padStart(2, "0")} / Componentes</span>
        <span>Una pieza por categoría</span>
        <span>Sin precio verificado = por cotizar</span>
      </div>
      <CatalogGrid components={components} />
    </main>
  );
}
export const dynamic = "force-dynamic";
