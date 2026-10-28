"use client";
export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="empty-state"><p className="eyebrow">Administración</p><h1>No pudimos abrir esta vista.</h1><p>La conexión puede estar temporalmente interrumpida. Volvé a intentar antes de enviar nuevos cambios.</p><button className="button" type="button" onClick={reset}>Volver a intentar</button></section>;
}
