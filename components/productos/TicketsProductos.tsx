"use client";
import { useState } from "react";
import Link from "next/link";
export function TicketsProductos({
  branches,
  editor,
}: {
  branches: { id: string; nombre: string }[];
  editor: boolean;
}) {
  const [items, setItems] = useState<
    { id: string; sku: string; titulo: string; stockTotal: number }[]
  >([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState("");
  return (
    <>
      <div className="elite-page-header">
        <div>
          <h1>Productos para tickets</h1>
          <p>
            Busca el equipo del cliente o registra el uso de un repuesto en un ticket existente.
          </p>
        </div>
      </div>
      <section className="elite-card elite-settings">
        {message && <p role="status">{message}</p>}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const query = String(new FormData(e.currentTarget).get("q") || "");
            setBusy(true);
            try {
              const response = await fetch(
                `/api/productos?q=${encodeURIComponent(query)}&pageSize=25`,
              );
              const result = await response.json();
              if (!response.ok) throw new Error(result.error?.message);
              setItems(result.items);
            } catch (e) {
              setMessage(e instanceof Error ? e.message : "No se pudo buscar");
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Buscar por SKU o modelo
            <input name="q" required minLength={2} />
          </label>
          <button disabled={busy} className="elite-button">
            Buscar productos
          </button>
        </form>
        {items.map((p) => (
          <div key={p.id} className="elite-toolbar">
            <Link href={`/admin/productos/${p.id}`}>
              {p.sku} · {p.titulo}
            </Link>
            <span>Stock: {p.stockTotal}</span>
            {editor && <button onClick={() => setSelected(p.id)}>Usar repuesto</button>}
          </div>
        ))}
        {editor && selected && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                !window.confirm(
                  "¿Descontar este repuesto del inventario y registrarlo en el ticket?",
                )
              )
                return;
              const data = new FormData(e.currentTarget);
              setBusy(true);
              try {
                const response = await fetch(`/api/productos/${selected}/ticket`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    ticket: data.get("ticket"),
                    sucursalId: data.get("sucursalId"),
                    cantidad: Number(data.get("cantidad")),
                  }),
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error?.message);
                setItems((v) =>
                  v.map((p) => (p.id === selected ? { ...p, stockTotal: result.stockTotal } : p)),
                );
                setSelected("");
                setMessage("Repuesto registrado en el historial del producto");
              } catch (e) {
                setMessage(e instanceof Error ? e.message : "No se pudo registrar");
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              Referencia del ticket
              <input name="ticket" required maxLength={100} />
            </label>
            <label>
              Sucursal
              <select name="sucursalId">
                {branches.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Cantidad
              <input type="number" name="cantidad" min={1} max={99999} defaultValue={1} required />
            </label>
            <button disabled={busy} className="elite-button">
              Descontar y registrar
            </button>
            <button type="button" onClick={() => setSelected("")}>
              Cancelar
            </button>
          </form>
        )}
      </section>
    </>
  );
}
