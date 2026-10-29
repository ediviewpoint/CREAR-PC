"use client";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <section className="elite-card" role="alert">
      <h1>No se pudo cargar el panel</h1>
      <p>Revisa tu conexión y vuelve a intentar. Tus productos guardados siguen en la base.</p>
      <button className="elite-button" onClick={reset}>
        Reintentar
      </button>
    </section>
  );
}
