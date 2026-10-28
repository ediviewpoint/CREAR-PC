"use client";
export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="main" className="shell empty-page">
      <p className="eyebrow">No disponible por el momento</p>
      <h1>No pudimos abrir esta vista.</h1>
      <p>Volvé a intentar. Si el problema continúa, contactanos con el enlace de esta página.</p>
      <button className="button" type="button" onClick={reset}>
        Volver a intentar
      </button>
    </main>
  );
}
