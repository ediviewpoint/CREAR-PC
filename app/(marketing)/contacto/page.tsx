import Link from "next/link";
export const metadata = {
  title: "Contacto",
  description:
    "Consultas sobre tu configuración, una cotización o el uso de tus datos en CREAR PC.",
};
export default function ContactPage() {
  const raw = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
  const email = raw && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw) ? raw : null;
  return (
    <main id="main" className="shell page-section contact-page">
      <header className="contact-heading">
        <p className="eyebrow">ELITEPC / Santa Cruz, Bolivia</p>
        <h1>
          Tu equipo empieza
          <br />
          con una buena pregunta.
        </h1>
        <p className="page-intro">
          Para entender una pieza, revisar una cotización o conocer cómo cuidamos tus datos.
        </p>
      </header>
      <div className="contact-grid">
        <section className="contact-primary">
          <p className="eyebrow">01 / Contacto del proyecto</p>
          <h2>Conversemos.</h2>
          {email ? (
            <>
              <p>
                Contanos qué necesitás. Si consultás por una proforma, incluí su código y el modelo
                del componente.
              </p>
              <a className="button" href={"mailto:" + email}>
                Escribir un correo ↗
              </a>
              <span className="mono small">{email}</span>
            </>
          ) : (
            <p>
              El canal de atención del proyecto todavía no está publicado. Para una compra o
              garantía, usá el contacto del vendedor que figura en tu comprobante.
            </p>
          )}
          <p className="small">No envíes contraseñas ni documentos de identidad completos.</p>
        </section>
        <div className="contact-topics">
          {[
            {
              n: "02",
              title: "Sobre una compra",
              text: "Precio final, disponibilidad, entrega y garantía se confirman con el vendedor.",
              href: "/politicas/garantia",
              label: "Ver guía de garantía",
            },
            {
              n: "03",
              title: "Sobre tus datos",
              text: "Conocé qué se guarda en esta pestaña, qué se guarda en línea y cómo se accede.",
              href: "/politicas/privacidad",
              label: "Leer privacidad",
            },
          ].map((t) => (
            <section key={t.n}>
              <p className="eyebrow">{t.n} / Te orientamos</p>
              <h2>{t.title}</h2>
              <p>{t.text}</p>
              <Link
                className="text-link"
                href={t.href as "/politicas/garantia" | "/politicas/privacidad"}
              >
                {t.label} ↗
              </Link>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
