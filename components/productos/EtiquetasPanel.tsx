"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function EtiquetasPanel({
  items,
  editor,
}: {
  items: { id: string; nombre: string; total: number }[];
  editor: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(method: string, data: unknown) {
    setBusy(true);
    try {
      const response = await fetch("/api/etiquetas", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message);
      setMessage("Etiquetas actualizadas");
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="elite-page-header">
        <h1>Etiquetas</h1>
      </div>
      <section className="elite-card elite-settings">
        {message && <p role="status">{message}</p>}
        {editor && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              void save("POST", { nombre: new FormData(form).get("nombre") });
              form.reset();
            }}
          >
            <label>
              Nueva etiqueta
              <input name="nombre" required maxLength={60} />
            </label>
            <button className="elite-button" disabled={busy}>
              Crear etiqueta
            </button>
          </form>
        )}
        {items.map((item) => (
          <form
            key={item.id}
            className="elite-toolbar"
            onSubmit={(e) => {
              e.preventDefault();
              void save("POST", {
                id: item.id,
                nombre: new FormData(e.currentTarget).get("nombre"),
              });
            }}
          >
            <input
              name="nombre"
              aria-label="Nombre de etiqueta"
              defaultValue={item.nombre}
              disabled={!editor || busy}
              required
              maxLength={60}
            />
            <span>{item.total} productos</span>
            {editor && (
              <>
                <button disabled={busy}>Renombrar</button>
                <button
                  type="button"
                  disabled={busy || item.total > 0}
                  onClick={() => {
                    if (window.confirm("¿Eliminar esta etiqueta sin productos?"))
                      void save("DELETE", { id: item.id });
                  }}
                >
                  Eliminar
                </button>
              </>
            )}
          </form>
        ))}
      </section>
    </>
  );
}
