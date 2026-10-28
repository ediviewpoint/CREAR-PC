import { getDb, schema } from "@/lib/db";
import { AdminMutationForm as AdminForm } from "./AdminForm";
import { savePriceAction, saveStoreAction } from "@/app/_actions/admin";
import { requireAdmin } from "@/lib/auth/admin";
import { formatBob } from "@/lib/utils/format";
import { ProductManager } from "./ProductManager";
import Link from "next/link";
import { selectCurrentOffers } from "@/lib/catalog/offers";
export async function AdminPanel({
  section,
}: {
  section: "componentes" | "precios" | "tiendas" | "builds" | "proformas" | "resumen";
}) {
  await requireAdmin();
  if (section === "componentes") return <ProductManager />;
  let data;
  try {
    const db = getDb(),
      [components, stores, prices, builds, proformas] = await Promise.all([
        db.select().from(schema.components),
        db.select().from(schema.stores),
        db.select().from(schema.prices),
        db.select().from(schema.builds),
        db.select().from(schema.proformas),
      ]);
    data = { components, stores, prices, builds, proformas };
  } catch {
    return (
      <section className="empty-state">
        <h1>Conexión pendiente.</h1>
        <p>
          La base no está disponible. Revisá DATABASE_URL y ejecutá las migraciones antes de cargar
          datos.
        </p>
      </section>
    );
  }
  const { components, stores, prices, builds, proformas } = data;
  const currentOffers = selectCurrentOffers(
    prices,
    new Set(stores.filter((store) => store.isActive).map((store) => store.id)),
    new Date(),
    new Set(stores.filter((store) => store.isOwn).map((store) => store.id)),
  );
  const pricedProducts = new Set(currentOffers.map((offer) => offer.componentId));
  const missingPrices = components.filter(
    (component) => component.isActive && !pricedProducts.has(component.id),
  ).length;
  if (section === "resumen")
    return (
      <section>
        <p className="eyebrow">Datos del taller</p>
        <h1>Todo, a la vista.</h1>
        <div className="product-editor__actions">
          <Link className="button" href="/admin/componentes/nuevo">
            Añadir producto +
          </Link>
          <Link className="button button--ghost" href="/admin/componentes/importar">
            Importar CSV
          </Link>
          <Link className="text-link" href="/catalog">
            Ver catálogo público ↗
          </Link>
        </div>
        {missingPrices > 0 && (
          <div className="admin-notice">
            <h2>Precios por completar</h2>
            <p>
              {missingPrices}{" "}
              {missingPrices === 1
                ? "producto publicado no tiene"
                : "productos publicados no tienen"}{" "}
              un precio disponible. Abrí su ficha para cargar precio y stock.
            </p>
            <Link className="text-link" href="/admin/componentes">
              Revisar productos ↗
            </Link>
          </div>
        )}
        <div className="admin-grid">
          {(
            [
              { label: "Productos", count: components.length, href: "/admin/componentes" },
              { label: "Tiendas", count: stores.length, href: "/admin/tiendas" },
              {
                label: "Productos con precio",
                count: components.filter((component) => pricedProducts.has(component.id)).length,
                href: "/admin/componentes",
              },
              { label: "Equipos guardados", count: builds.length, href: "/admin/builds" },
              { label: "Proformas", count: proformas.length, href: "/admin/proformas" },
            ] as const
          ).map(({ label, count, href }) => (
            <Link className="admin-card" key={label} href={href}>
              <p>{label}</p>
              <strong>{count}</strong>
            </Link>
          ))}
        </div>
      </section>
    );
  const records =
    section === "tiendas"
      ? stores.map((s) => [s.name, s.city, s.website ?? "—"])
      : section === "precios"
        ? [...prices]
            .sort((a, b) => b.observedAt.getTime() - a.observedAt.getTime())
            .map((p) => [
              components.find((c) => c.id === p.componentId)?.nameDisplay ?? p.componentId,
              stores.find((s) => s.id === p.storeId)?.name ?? p.storeId,
              formatBob(Number(p.amount)),
              p.inStock ? "Disponible" : "Sin stock",
              p.observedAt.toISOString().slice(0, 10),
            ])
        : section === "builds"
          ? builds.map((b) => [
              b.name,
              b.isPublic ? "Público" : "Privado",
              formatBob(Number(b.totalBob)),
              b.updatedAt.toISOString().slice(0, 10),
            ])
          : proformas.map((p) => [
              p.code,
              p.clientName,
              formatBob(Number(p.totalBob)),
              p.validUntil,
              p.isPublic ? "Pública" : "Privada",
            ]);
  const headings =
    section === "tiendas"
      ? ["Tienda", "Ciudad", "Sitio"]
      : section === "precios"
        ? ["Componente", "Tienda", "Bs.", "Stock", "Consulta"]
        : section === "builds"
          ? ["Build", "Acceso", "Total", "Actualización"]
          : ["Código", "Cliente", "Total", "Vencimiento", "Acceso"];
  return (
    <section>
      <p className="eyebrow">Administración</p>
      <h1>{section[0]!.toUpperCase() + section.slice(1)}</h1>
      <div className="admin-table-wrap" tabIndex={0} role="region" aria-label="Registros">
        <table>
          <thead>
            <tr>
              {headings.map((h) => (
                <th key={h} scope="col">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (
                  <td key={j}>{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!records.length && <p className="muted">Todavía no hay registros.</p>}
      {section === "tiendas" && (
        <AdminForm action={saveStoreAction}>
          <h2>Registrar tienda</h2>
          <label>
            Nombre
            <input name="name" required maxLength={120} />
          </label>
          <label>
            Ciudad
            <input name="city" required maxLength={80} defaultValue="Santa Cruz" />
          </label>
          <label>
            Sitio web (opcional)
            <input name="website" type="url" />
          </label>
        </AdminForm>
      )}
      {section === "precios" && (
        <AdminForm action={savePriceAction}>
          <h2>Nueva cotización verificada</h2>
          <label>
            Componente
            <select name="componentId" required>
              <option value="">Elegí una pieza</option>
              {components.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameDisplay}
                  {c.isActive ? "" : " (borrador)"}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tienda
            <select name="storeId" required>
              <option value="">Elegí una tienda</option>
              {stores
                .filter((s) => s.isActive && !s.isOwn)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Importe Bs.
            <input name="amount" type="number" min="0.01" step="0.01" required />
          </label>
          <label>
            Fuente de la cotización
            <input name="sourceUrl" type="url" required />
          </label>
          <label className="check-label">
            <input name="inStock" type="checkbox" defaultChecked />
            Disponible en tienda
          </label>
          <label>
            Cantidad disponible (opcional)
            <input name="stockQty" type="number" min="0" max="1000000" step="1" />
          </label>
          <p className="small muted">
            Para tu tienda, editá precio y stock en la ficha del producto. Este formulario registra
            cotizaciones externas, con vigencia de 7 días.
          </p>
        </AdminForm>
      )}
    </section>
  );
}
