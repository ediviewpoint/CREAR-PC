import Link from "next/link";
import { Package, PackageX, TriangleAlert, CalendarPlus, Plus } from "lucide-react";
import { getDashboard } from "@/lib/admin-dashboard";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/auth-permissions";
export const metadata = { title: "Inicio · ElitePC" };
export default async function Page() {
  const [data, session] = await Promise.all([getDashboard(), auth()]);
  const metrics = [
    { label: "Productos activos", value: data.total, icon: Package },
    { label: "Productos agotados", value: data.exhausted, icon: PackageX },
    { label: "Con stock bajo", value: data.low, icon: TriangleAlert },
    { label: "Creados esta semana", value: data.created, icon: CalendarPlus },
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
        {metrics.map(({ label, value, icon: Icon }) => (
          <div className="elite-card elite-stat" key={label}>
            <Icon aria-hidden="true" />
            <span>{label}</span>
            <strong>{value.toLocaleString("es-BO")}</strong>
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
