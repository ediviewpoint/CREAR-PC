export function RouteLoading({ kind = "build" }: { kind?: "build" | "catalog" }) {
  return (
    <main id="main" className="shell route-loading" aria-busy="true">
      <p className="eyebrow">{kind === "build" ? "Tu mesa de trabajo" : "Componentes"}</p>
      <h1>{kind === "build" ? "Preparando tu equipo…" : "Preparando las piezas…"}</h1>
      <p className="muted" role="status">
        Cargando las fichas del catálogo.
      </p>
      <div className={`route-loading__grid route-loading__grid--${kind}`} aria-hidden="true">
        {[0, 1, 2].map((item) => (
          <div className="route-loading__panel" key={item}>
            <span className="route-loading__line" />
            <span className="route-loading__line route-loading__line--short" />
            <div className="route-loading__picture" />
            <span className="route-loading__line" />
            <span className="route-loading__line route-loading__line--short" />
          </div>
        ))}
      </div>
    </main>
  );
}
