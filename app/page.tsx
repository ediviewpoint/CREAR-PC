import { BrandsSection } from "@/components/brand/BrandsSection";
import Link from "next/link";
import { CaseExperience } from "@/components/landing/CaseExperience";
import { HardwareIcon } from "@/components/icons";
import { Reveal } from "@/components/motion/Reveal";
const features = [
  {
    kind: "mobo" as const,
    title: "Cada pieza, en su lugar.",
    text: "Revisá sockets, memoria, espacio y potencia antes de decidir. La compatibilidad se explica, no se adivina.",
    label: "01 / Compatibilidad",
  },
  {
    kind: "cpu" as const,
    title: "Tu presupuesto, en Bs.",
    text: "Compará precios cuando haya cotizaciones verificadas. Las piezas sin precio se identifican con claridad.",
    label: "02 / Precios locales",
  },
  {
    kind: "storage" as const,
    title: "Todo, por escrito.",
    text: "Reuní componentes, cantidades y condiciones en una proforma PDF clara, lista para conversar con tu tienda.",
    label: "03 / Proforma PDF",
  },
];
export default function HomePage() {
  return (
    <main id="main">
      <section className="hero shell" aria-labelledby="hero-title">
        <div className="hero__eyebrow">
          <span className="eyebrow">Hecho en Santa Cruz · 100% boliviano</span>
          <span className="mono hero__edition">Configurador / 01</span>
        </div>
        <div className="hero__heading">
          <h1 id="hero-title">
            Armá tu PC.
            <br />
            <span>Con precios de Bolivia.</span>
          </h1>
          <p>
            Elegí cada pieza con criterio.
            <br />
            Dale forma al equipo que necesitás.
          </p>
        </div>
        <div className="hero__actions">
          <Link className="button" href="/build">
            Comenzar build <span aria-hidden="true">↗</span>
          </Link>
          <Link className="button button--ghost" href="/build?mode=existing">
            Ya tengo mis componentes
          </Link>
        </div>
        <CaseExperience />
        <div className="hero-note">
          <span className="status-mark" aria-hidden="true" />
          <p>
            Ocho piezas para empezar. Compatibilidad en tiempo real. Precios pendientes, siempre
            identificados.
          </p>
          <Link href="/catalog">Explorar catálogo ↗</Link>
        </div>
        <div className="hero__foot">
          <span>Potencia con criterio.</span>
          <a href="#como-funciona">
            Conocé la mesa de trabajo <span aria-hidden="true">↓</span>
          </a>
        </div>
      </section>
      <BrandsSection />
      <section className="features shell" id="como-funciona" aria-label="Cómo funciona">
        <div className="section-heading">
          <p className="eyebrow">Menos dudas. Más claridad.</p>
          <h2>
            Un equipo que tiene sentido.
            <br />
            De principio a fin.
          </h2>
        </div>
        <div className="features__grid">
          {features.map((f, i) => (
            <Reveal key={f.kind} index={i} className="feature">
              <HardwareIcon kind={f.kind} />
              <p className="eyebrow">{f.label}</p>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="assurance shell" aria-label="Antes de comprar">
        <div>
          <p className="eyebrow">Elegí con información</p>
          <h2>
            La confianza también
            <br />
            se arma por piezas.
          </h2>
        </div>
        <div>
          <p>
            Consultá la garantía comercial de cada producto en su ficha y en la proforma.
            Revisá las condiciones de cobertura antes de comprar.
          </p>
          <Link className="text-link" href="/politicas/garantia">
            Qué revisar de la garantía ↗
          </Link>
        </div>
      </section>
      <section className="closing shell">
        <p className="eyebrow">Tu próxima PC empieza acá</p>
        <h2>La mejor pieza es la que encaja.</h2>
        <Link className="text-link" href="/build">
          Abrí tu mesa de trabajo <span aria-hidden="true">↗</span>
        </Link>
      </section>
    </main>
  );
}
