"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import {
  setProductPublicationAction,
  duplicateManagedProductAction,
} from "@/app/_actions/products";
import { formatBob } from "@/lib/utils/format";
export type ProductListRow = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  categoryLabel: string;
  published: boolean;
  version: string;
  photoUrl?: string;
  priceBob: number | null;
};
export function ProductList({ products }: { products: ProductListRow[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  const filtered = products.filter(
    (row) =>
      `${row.name} ${row.brand} ${row.categoryLabel}`
        .toLocaleLowerCase("es")
        .includes(search.trim().toLocaleLowerCase("es")) &&
      (status === "all" || (status === "published" ? row.published : !row.published)) &&
      (priceFilter === "all" ||
        (priceFilter === "priced" ? row.priceBob !== null : row.priceBob === null)),
  );
  return (
    <>
      <div className="product-list-toolbar">
        <label>
          Buscar producto
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Marca, modelo o categoría"
          />
        </label>
        <label>
          Estado
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">Todos</option>
            <option value="published">Publicados</option>
            <option value="draft">Borradores / Desactivados</option>
          </select>
        </label>
        <label>
          Precio
          <select value={priceFilter} onChange={(event) => setPriceFilter(event.target.value)}>
            <option value="all">Todos los precios</option>
            <option value="priced">Con precio disponible</option>
            <option value="missing">Sin precio disponible</option>
          </select>
        </label>
        <Link className="button" href="/admin/componentes/nuevo">
          Añadir producto +
        </Link>
        <Link className="button button--ghost" href="/admin/componentes/importar">
          Importar CSV
        </Link>
        <Link className="button button--ghost" href="/admin/componentes/ia">
          Cargar con IA
        </Link>
      </div>
      <p className="small muted" role="status">
        {filtered.length} de {products.length} productos ·{" "}
        {products.filter((row) => row.published).length} publicados
      </p>
      {message && (
        <p className="product-editor__message" role="status">
          {message}
        </p>
      )}
      {filtered.length > 0 ? (
        <div
          className="admin-table-wrap product-list"
          role="region"
          aria-label="Productos, desplazable"
          tabIndex={0}
        >
          <table>
            <thead>
              <tr>
                <th scope="col">Producto</th>
                <th scope="col">Categoría</th>
                <th scope="col">Estado</th>
                <th scope="col">Precio vigente</th>
                <th scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="product-list__identity">
                      {row.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={row.photoUrl} alt="" width={60} height={48} loading="lazy" />
                      ) : (
                        <span className="product-list__no-photo" aria-label="Sin foto">
                          —
                        </span>
                      )}
                      <div>
                        <strong>{row.name}</strong>
                        <span className="small muted">{row.brand}</span>
                      </div>
                    </div>
                  </td>
                  <td>{row.categoryLabel}</td>
                  <td>
                    <span className="product-status">
                      {row.published ? "Publicado" : "Borrador / Desactivado"}
                    </span>
                  </td>
                  <td>{row.priceBob === null ? "Por cotizar" : formatBob(row.priceBob)}</td>
                  <td>
                    <div className="product-list__actions">
                      <Link className="button button--ghost" href={`/admin/componentes/${row.id}`}>
                        Editar
                      </Link>
                      {row.published && (
                        <Link
                          className="text-link small"
                          href={`/catalog/${row.category}/${row.slug}` as Route}
                        >
                          Ver ficha ↗
                        </Link>
                      )}
                      <button
                        className="text-link small"
                        disabled={pending}
                        type="button"
                        aria-label={`Duplicar ${row.name}`}
                        onClick={() =>
                          start(async () => {
                            try {
                              const result = await duplicateManagedProductAction(row.id);
                              setMessage(result.message);
                              if (result.ok && result.id)
                                router.push(`/admin/componentes/${result.id}`);
                            } catch {
                              setMessage("No se pudo duplicar. Volvé a intentar.");
                            }
                          })
                        }
                      >
                        Duplicar
                      </button>
                      <button
                        className="text-link small"
                        disabled={pending}
                        type="button"
                        aria-label={`${row.published ? "Desactivar" : "Publicar"} ${row.name}`}
                        onClick={() =>
                          start(async () => {
                            try {
                              const form = new FormData();
                              form.set("id", row.id);
                              form.set("publish", String(!row.published));
                              form.set("version", row.version);
                              const result = await setProductPublicationAction(form);
                              setMessage(result.message);
                              if (result.ok) router.refresh();
                            } catch {
                              setMessage("No se pudo cambiar la publicación. Volvé a intentar.");
                            }
                          })
                        }
                      >
                        {pending ? "Actualizando…" : row.published ? "Desactivar" : "Publicar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <h2>
            {products.length
              ? "No hay coincidencias."
              : "Tu catálogo empieza con el primer producto."}
          </h2>
          <p>
            {products.length
              ? "Probá otra búsqueda o cambiá el filtro de estado."
              : "Podés preparar la ficha y la foto como borrador antes de publicarlo."}
          </p>
          {products.length > 0 && (
            <button
              className="button button--ghost"
              type="button"
              onClick={() => {
                setSearch("");
                setStatus("all");
                setPriceFilter("all");
              }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}
    </>
  );
}
