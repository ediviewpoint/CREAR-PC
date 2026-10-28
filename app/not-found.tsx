import Link from "next/link";
export default function NotFound() {
  return (
    <main className="shell empty-page" id="main">
      <p className="eyebrow">404 / No disponible</p>
      <h1>No encontramos esa página.</h1>
      <p>Revisá el enlace o volvé al catálogo.</p>
      <Link className="button" href="/catalog">
        Ver componentes
      </Link>
    </main>
  );
}
