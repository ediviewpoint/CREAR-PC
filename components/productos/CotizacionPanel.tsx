"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { formatAmount } from "@/lib/precios";
import type { QuoteItem } from "@/lib/cotizaciones";
type Quote = {
  id: string;
  codigo: string | null;
  cliente: string | null;
  snapshot: { items: QuoteItem[] };
  createdAt: string;
  estado: string;
};
export function CotizacionPanel() {
  const [open, setOpen] = useState<Quote | null>(null);
  const [history, setHistory] = useState<Quote[]>([]);
  const [client, setClient] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function load() {
    const response = await fetch("/api/cotizaciones");
    const result = await response.json();
    if (!response.ok) throw new Error(result.error?.message);
    setOpen(result.abierta);
    setHistory(result.historial);
  }
  useEffect(() => {
    void Promise.resolve()
      .then(load)
      .catch((e) => setError(e.message));
  }, []);
  async function action(body: unknown) {
    setBusy(true);
    try {
      const response = await fetch("/api/cotizaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || "No se pudo guardar");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }
  const items = open?.snapshot.items || [];
  const total = items.reduce(
    (sum, v) =>
      sum +
      (v.producto.precioOferta || v.producto.precioSinFactura || v.producto.precioConFactura || 0) *
        v.cantidad,
    0,
  );
  return (
    <>
      <div className="elite-page-header">
        <div>
          <h1>Cotización</h1>
          <p>Los precios se conservan desde que agregas cada producto.</p>
        </div>
        <Link href="/admin/productos" className="elite-button">
          Agregar productos
        </Link>
      </div>
      {error && (
        <p className="elite-notice is-error" role="alert">
          {error}
        </p>
      )}
      <section className="elite-card elite-settings">
        <h2>Cotización abierta</h2>
        {!items.length ? (
          <p>Agrega productos desde el listado o su ficha.</p>
        ) : (
          <>
            <table className="elite-products-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Precio S/F</th>
                  <th>Precio C/F</th>
                  <th>Cantidad</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.productoId}>
                    <td>
                      {item.producto.sku} {item.producto.titulo}
                    </td>
                    <td>
                      {formatAmount(item.producto.precioOferta || item.producto.precioSinFactura)}
                    </td>
                    <td>{formatAmount(item.producto.precioConFactura)}</td>
                    <td>
                      <input
                        type="number"
                        min={1}
                        max={9999}
                        defaultValue={item.cantidad}
                        disabled={busy}
                        onBlur={(e) =>
                          void action({
                            accion: "cantidad",
                            productoId: item.productoId,
                            cantidad: Number(e.target.value),
                          })
                        }
                      />
                    </td>
                    <td>
                      <button
                        className="elite-button secondary"
                        disabled={busy}
                        onClick={() => {
                          if (window.confirm("¿Quitar este producto de la cotización?"))
                            void action({
                              accion: "cantidad",
                              productoId: item.productoId,
                              cantidad: 0,
                            });
                        }}
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p>
              Total de precios principales: <strong>{formatAmount(total)}</strong>
            </p>
            <label>
              Cliente o referencia
              <input value={client} onChange={(e) => setClient(e.target.value)} maxLength={200} />
            </label>
            <div className="elite-toolbar">
              <button
                className="elite-button"
                disabled={busy}
                onClick={() => void action({ accion: "emitir", cliente: client })}
              >
                Emitir cotización
              </button>
              <a
                className="elite-button secondary"
                href={`/api/cotizaciones/${open!.id}/pdf`}
                download
              >
                Descargar PDF
              </a>
              <button
                className="elite-button secondary"
                disabled={busy}
                onClick={() => {
                  if (window.confirm("¿Archivar esta cotización y empezar una nueva?"))
                    void action({ accion: "nueva" });
                }}
              >
                Nueva cotización
              </button>
            </div>
          </>
        )}
      </section>
      <section className="elite-card" style={{ marginTop: 24 }}>
        <h2>Historial de cotizaciones</h2>
        <ul className="elite-product-list">
          {history.map((quote) => (
            <li key={quote.id}>
              <a href={`/api/cotizaciones/${quote.id}/pdf`} download>
                <strong>
                  {quote.codigo || "Archivada"} · {quote.cliente || "Sin referencia"}
                </strong>
                <small>{new Date(quote.createdAt).toLocaleString("es-BO")}</small>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
