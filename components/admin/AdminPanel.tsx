import { getDb, schema } from "@/lib/db";
import { AdminForm } from "./AdminForm";
import { savePriceAction, saveStoreAction, saveComponentAction } from "@/app/_actions/admin";
import { requireAdmin } from "@/lib/auth/admin";
import { formatBob } from "@/lib/utils/format";
import { componentCategory } from "@/lib/schemas/components";
export async function AdminPanel({
  section,
}: {
  section: "componentes" | "precios" | "tiendas" | "builds" | "proformas" | "resumen";
}) {
  await requireAdmin();
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
  if (section === "resumen")
    return (
      <section>
        <p className="eyebrow">Datos del taller</p>
        <h1>Todo, a la vista.</h1>
        <div className="admin-grid">
          {[
            ["Componentes", components.length],
            ["Tiendas", stores.length],
            ["Cotizaciones", prices.length],
            ["Builds", builds.length],
            ["Proformas", proformas.length],
          ].map(([label, count]) => (
            <div className="admin-card" key={label}>
              <p>{label}</p>
              <strong>{count}</strong>
            </div>
          ))}
        </div>
      </section>
    );
  const records =
    section === "componentes"
      ? components.map((c) => [c.nameDisplay, c.category, c.brand, c.slug])
      : section === "tiendas"
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
    section === "componentes"
      ? ["Componente", "Categoría", "Marca", "Slug"]
      : section === "tiendas"
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
              {components
                .filter((c) => c.isActive)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameDisplay}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Tienda
            <select name="storeId" required>
              <option value="">Elegí una tienda</option>
              {stores
                .filter((s) => s.isActive)
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
          <p className="small muted">
            El registro agrega una observación al historial. La UI usa la última por tienda, con
            vigencia de 7 días.
          </p>
        </AdminForm>
      )}
      {section === "componentes" && (
        <AdminForm action={saveComponentAction}>
          <h2>Registrar componente</h2>
          <label>
            Categoría
            <select name="category">
              {componentCategory.options
                .filter((c) => !["fan", "monitor"].includes(c))
                .map((c) => (
                  <option key={c}>{c}</option>
                ))}
            </select>
          </label>
          <label>
            Nombre completo
            <input name="name" required maxLength={180} />
          </label>
          <label>
            Marca
            <input name="brand" required maxLength={60} />
          </label>
          <label>
            Slug único
            <input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={120} />
          </label>
          <label>
            Fuente del fabricante
            <input name="source" type="url" required />
          </label>
          <label>
            Especificaciones JSON de la categoría
            <textarea name="spec" rows={12} required placeholder='{"socket":"AM5", ...}' />
          </label>
        </AdminForm>
      )}
    </section>
  );
}
