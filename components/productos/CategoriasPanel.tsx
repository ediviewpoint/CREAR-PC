"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CategoriasRapidas } from "./CategoriasRapidas";
type Category = {
  id: string;
  nombre: string;
  padreId: string | null;
  total: number;
  plantillaTitulo: string;
  specsSugeridas: { campo: string; icono?: string | null; obligatorio: boolean }[];
};
export function CategoriasPanel({
  categories,
  editor,
}: {
  categories: Category[];
  editor: boolean;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState<Category | null>(categories[0] || null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <>
      <div className="elite-page-header">
        <h1>Categorías</h1>
        {editor && <CategoriasRapidas categories={categories} />}
      </div>
      <section className="elite-card elite-settings">
        <label>
          Elige una categoría
          <select
            value={current?.id || ""}
            onChange={(e) => setCurrent(categories.find((v) => v.id === e.target.value) || null)}
          >
            {categories.map((v) => (
              <option value={v.id} key={v.id}>
                {v.padreId ? "↳ " : ""}
                {v.nombre} ({v.total})
              </option>
            ))}
          </select>
        </label>
        {message && <p role="status">{message}</p>}
        {current && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
                const response = await fetch(`/api/categorias/${current.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    nombre: current.nombre,
                    plantillaTitulo: current.plantillaTitulo,
                    specsSugeridas: current.specsSugeridas,
                  }),
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error?.message);
                setMessage("Categoría guardada");
                router.refresh();
              } catch (e) {
                setMessage(e instanceof Error ? e.message : "No se pudo guardar");
              } finally {
                setBusy(false);
              }
            }}
          >
            <fieldset disabled={!editor || busy}>
              <label>
                Nombre
                <input
                  value={current.nombre}
                  onChange={(e) => setCurrent({ ...current, nombre: e.target.value })}
                />
              </label>
              <label>
                Plantilla de título
                <input
                  value={current.plantillaTitulo}
                  onChange={(e) => setCurrent({ ...current, plantillaTitulo: e.target.value })}
                />
              </label>
              <p>
                Puedes usar MARCA, MODELO, PART_NUMBER, PROCESADOR_CORTO y PANTALLA entre llaves.
              </p>
              <h2>Campos técnicos sugeridos</h2>
              {current.specsSugeridas.map((spec, i) => (
                <div key={i} className="elite-editor-row">
                  <input
                    aria-label={`Nombre de campo ${i + 1}`}
                    value={spec.campo}
                    onChange={(e) =>
                      setCurrent({
                        ...current,
                        specsSugeridas: current.specsSugeridas.map((v, j) =>
                          j === i ? { ...v, campo: e.target.value } : v,
                        ),
                      })
                    }
                  />
                  <label>
                    <input
                      type="checkbox"
                      checked={spec.obligatorio}
                      onChange={(e) =>
                        setCurrent({
                          ...current,
                          specsSugeridas: current.specsSugeridas.map((v, j) =>
                            j === i ? { ...v, obligatorio: e.target.checked } : v,
                          ),
                        })
                      }
                    />
                    Obligatorio para ficha completa
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrent({
                        ...current,
                        specsSugeridas: current.specsSugeridas.filter((_, j) => j !== i),
                      })
                    }
                  >
                    Quitar
                  </button>
                </div>
              ))}
              <div className="elite-toolbar">
                <button
                  type="button"
                  className="elite-button secondary"
                  onClick={() =>
                    setCurrent({
                      ...current,
                      specsSugeridas: [
                        ...current.specsSugeridas,
                        { campo: "Nuevo campo", icono: null, obligatorio: false },
                      ],
                    })
                  }
                >
                  Agregar campo
                </button>
                <button className="elite-button">Guardar categoría</button>
                <button
                  type="button"
                  className="elite-button secondary"
                  onClick={async () => {
                    if (!window.confirm("¿Eliminar esta categoría sin productos?")) return;
                    const response = await fetch(`/api/categorias/${current.id}`, {
                      method: "DELETE",
                    });
                    const result = await response.json();
                    setMessage(
                      response.ok
                        ? "Categoría eliminada"
                        : result.error?.message || "No se pudo eliminar",
                    );
                    if (response.ok) {
                      setCurrent(null);
                      router.refresh();
                    }
                  }}
                >
                  Eliminar categoría vacía
                </button>
              </div>
            </fieldset>
          </form>
        )}
      </section>
    </>
  );
}
