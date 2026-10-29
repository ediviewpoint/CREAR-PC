export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Cargando panel">
      <div className="elite-skeleton" style={{ width: 180, height: 32, marginBottom: 30 }} />
      <div className="elite-stats">
        {Array.from({ length: 4 }, (_, i) => (
          <div className="elite-card" key={i}>
            <div className="elite-skeleton" />
            <div className="elite-skeleton" style={{ width: "40%", height: 35 }} />
          </div>
        ))}
      </div>
      <div className="elite-card">
        {Array.from({ length: 8 }, (_, i) => (
          <div className="elite-skeleton" key={i} />
        ))}
      </div>
    </div>
  );
}
