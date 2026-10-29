import { requireSession } from "@/lib/auth";
export default async function Profile() {
  const session = await requireSession();
  return (
    <>
      <div className="elite-page-header">
        <h1>Mi perfil</h1>
      </div>
      <section className="elite-card">
        <h2>{session.user.name}</h2>
        <p>{session.user.email}</p>
        <span className="elite-badge">{session.user.rol}</span>
        <p className="elite-muted">
          Un administrador gestiona tu acceso y tu rol desde Configuración.
        </p>
      </section>
    </>
  );
}
