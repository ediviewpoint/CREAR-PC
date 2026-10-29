import Link from "next/link";
import { Package, PackageX, TriangleAlert, CalendarPlus, Plus, FileEdit } from "lucide-react";
import { getDashboard } from "@/lib/admin-dashboard";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/auth-permissions";
export const metadata = { title: "Inicio · ElitePC" };
export default async function Page() {
  const [data, session] = await Promise.all([getDashboard(), auth()]);
  // Fase 0 · H-02: cada tarjeta trae una definición breve para que el dueño
  // sepa qué cuenta y qué no, y por qué puede ver 0 activos con 9 cargados.
  const metrics = [
    {
      label: "Productos activos",
      value: data.total,
      icon: Package,
      hint: "Publicados, no eliminados.",
    },
    {
      label: "En borrador",
      value: data.drafts,
      icon: FileEdit,
      hint: "Cargados pero sin publicar todavía.",
    },
    {
      label: "Agotados",
      value: data.exhausted,
      icon: PackageX,
      hint: "Publicados sin stock disponible.",
    },
    {
      label: "Stock bajo",
      value: data.low,
      icon: TriangleAlert,
      hint: "Por debajo del umbral de la configuración.",
    },
    {
      label: "Creados esta semana",
      value: data.created,
      icon: CalendarPlus,
      hint: "Lunes 00:00 BOT en adelante.",
    },
  ];
  return (
    <>
      <div className="elite-page-header">
        <div>
          <h1>Inicio</h1>
          <p>Tu catálogo y las tareas pendientes de hoy.</p>
        </div>
        {session && hasRole(session.user.rol, "EDITOR") && (
          <Link className="elite-button" href="/admin/productos/nuevo">
            <Plus size={16} />
            Nuevo producto
          </Link>
        )}
      </div>
      <div className="elite-stats">
        {metrics.map(({ label, value, icon: Icon, hint }) => (
          <div className="elite-card elite-stat" key={label} title={hint}>
            <Icon aria-hidden="true" />
            <span>{label}</span>
            <strong>{value.toLocaleString("es-BO")}</strong>
            <small className="muted">{hint}</small>
          </div>
        ))}
      </div>
      <div className="elite-dashboard-grid">
        <section className="elite-card">
          <h2>Últimos productos editados</h2>
          {data.recent.length ? (
            <ul className="elite-product-list">
              {data.recent.map((item) => (
                <li key={item.id}>
                  <Link href={`/admin/productos/${item.id}`}>
                    <div>
                      <strong>{item.titulo}</strong>
                      <small>{item.sku}</small>
                    </div>
                    <time dateTime={item.updatedAt.toISOString()}>
                      {new Intl.DateTimeFormat("es-BO", {
                        dateStyle: "short",
                        timeZone: "America/La_Paz",
                      }).format(item.updatedAt)}
                    </time>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="elite-empty">
              <Package size={32} />
              <p>Todavía no cargaste productos</p>
              <p>Los productos que guardes aparecerán aquí.</p>
            </div>
          )}
        </section>
        <section className="elite-card">
          <h2>Datos por completar</h2>
          {data.incomplete.length ? (
            <ul className="elite-product-list">
              {data.incomplete.map((item) => (
                <li key={item.id}>
                  <Link href={`/admin/productos/${item.id}`}>
                    <div>
                      <strong>{item.titulo}</strong>
                      <small>
                        {item.sku} ·{" "}
                        {[
                          !item._count.imagenes && "Sin imagen",
                          item.tipo === "CARRITO" &&
                            !item.precioSinFactura &&
                            !item.precioConFactura &&
                            "Sin precio",
                          item.requiereRevision && "Requiere revisión",
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </small>
                    </div>
                    <TriangleAlert size={17} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="elite-empty">No hay productos con datos pendientes.</div>
          )}
        </section>
      </div>
    </>
  );
}
