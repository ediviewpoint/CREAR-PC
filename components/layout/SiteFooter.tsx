import Link from "next/link";
import { Brand } from "@/components/brand/Brand";
export function SiteFooter() {
  return (
    <footer className="site-footer shell">
      <div className="footer-signature">
        <Link href="/" className="brand-link" aria-label="ELITEPC · CREAR PC, inicio">
          <Brand />
        </Link>
        <p>
          Potencia con criterio.
          <br />
          Hecho en Santa Cruz, Bolivia.
        </p>
        <span className="eyebrow">Cada pieza tiene su lugar.</span>
      </div>
      <div className="footer-group">
        <p className="eyebrow">Tu equipo</p>
        <nav aria-label="Explorar">
          <Link href="/catalog">Explorar componentes ↗</Link>
          <Link href="/build">Armar mi PC ↗</Link>
          <Link href="/proforma/ejemplo">Ver proforma de ejemplo</Link>
          <Link href="/contacto">Contacto</Link>
        </nav>
      </div>
      <div className="footer-group">
        <p className="eyebrow">Información clara</p>
        <nav aria-label="Políticas">
          <Link href="/politicas/garantia">Garantía</Link>
          <Link href="/politicas/privacidad">Privacidad</Link>
          <Link href="/politicas/terminos">Términos</Link>
          <Link href="/politicas/cookies">Cookies</Link>
          <Link href="/politicas/proforma-condiciones">Proformas</Link>
        </nav>
      </div>
      <div className="footer-bottom">
        <span>CREAR PC / Configurador boliviano</span>
        <span>Precios en Bs. · Sin pagos en línea</span>
      </div>
    </footer>
  );
}
