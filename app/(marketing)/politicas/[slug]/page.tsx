import { readFile } from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
const policies: Record<string, { title: string; intro: string; summary: string }> = {
  garantia: {
    title: "Garantía, sin letra chica.",
    intro: "Qué pedir antes de comprar y cómo actuar si una pieza falla.",
    summary:
      "La garantía comercial se informa en la ficha de cada producto y en su proforma. Consultá las condiciones de cobertura antes de comprar.",
  },
  privacidad: {
    title: "Tus datos, con claridad.",
    intro: "Qué se guarda, para qué se utiliza y quién puede acceder.",
    summary:
      "Un borrador local vive en esta pestaña. Guardar en línea y habilitar un enlace público son acciones diferentes.",
  },
  terminos: {
    title: "Las reglas, a la vista.",
    intro: "El alcance del configurador y las condiciones para usarlo.",
    summary:
      "Podés explorar y configurar sin realizar un pago. Una validación técnica orienta tu decisión; revisá siempre el modelo exacto.",
  },
  cookies: {
    title: "Solo lo que hace falta.",
    intro: "Cookies y almacenamiento utilizados por esta versión del sitio.",
    summary:
      "La sesión de visitante protege tus builds guardados. El borrador local usa almacenamiento de la pestaña.",
  },
  "proforma-condiciones": {
    title: "Tu cotización, por escrito.",
    intro: "La diferencia entre un borrador y una proforma emitida.",
    summary:
      "«Por cotizar» significa que falta un precio. Un borrador no confirma stock, reserva ni venta.",
  },
};
const labels: Record<string, string> = {
  garantia: "Garantía",
  privacidad: "Privacidad",
  terminos: "Términos",
  cookies: "Cookies",
  "proforma-condiciones": "Proformas",
};
function anchor(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
export function generateStaticParams() {
  return Object.keys(policies).map((slug) => ({ slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = policies[(await params).slug];
  return { title: p?.title ?? "Políticas", description: p?.intro };
}
export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!Object.hasOwn(policies, slug)) notFound();
  const policy = policies[slug]!;
  const markdown = await readFile(path.join(process.cwd(), "docs/POLICIES", slug + ".md"), "utf8");
  const content = markdown.replace(/^# .*\r?\n/, "");
  const headings = [...content.matchAll(/^## (.+)$/gm)].map((m) => m[1]!.trim());
  return (
    <main id="main" className="shell page-section policy-page">
      <header className="policy-heading">
        <p className="eyebrow">Centro de información / CREAR PC</p>
        <h1>{policy.title}</h1>
        <p>{policy.intro}</p>
      </header>
      <nav className="policy-tabs" aria-label="Políticas">
        {Object.keys(policies).map((key) => (
          <a key={key} href={"/politicas/" + key} aria-current={key === slug ? "page" : undefined}>
            {labels[key]}
          </a>
        ))}
      </nav>
      <div className="policy-layout">
        <aside className="policy-index">
          <p className="eyebrow">En esta página</p>
          <nav aria-label="Índice de la política">
            {headings.map((h, i) => (
              <a key={h} href={"#" + anchor(h)}>
                <span className="mono">{String(i + 1).padStart(2, "0")}</span>
                {h}
              </a>
            ))}
          </nav>
          <Link className="text-link small" href="/contacto">
            Consultar un caso ↗
          </Link>
        </aside>
        <div className="policy-body">
          <div className="policy-summary">
            <span className="eyebrow">Lo esencial</span>
            <p>{policy.summary}</p>
          </div>
          <article className="legal-content">
            <Markdown
              remarkPlugins={[remarkGfm]}
              components={{
                h2: ({ children }) => <h2 id={anchor(String(children))}>{children}</h2>,
              }}
            >
              {content}
            </Markdown>
          </article>
          <div className="policy-end">
            <p>Información para decidir con más claridad.</p>
            <Link className="text-link" href="/catalog">
              Volver a los componentes ↗
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
