"use client";
import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  suggestProductsAction,
  saveAiDraftsAction,
  type AiActionState,
} from "@/app/_actions/ai-products";
import type { AiProductDraft } from "@/lib/admin/ai-products";
import type { ProductCategory, SpecField } from "@/lib/admin/component-fields";

type Props = {
  configured: boolean;
  categories: { key: ProductCategory; label: string }[];
  fieldSets: Record<ProductCategory, SpecField[]>;
  name?: string;
  lockedCategory?: ProductCategory;
  batch?: boolean;
  onApply?: (draft: AiProductDraft, replace: boolean) => string | void;
  onBusyChange?: (busy: boolean) => void;
};
export function ProductAiAssistant({
  configured,
  categories,
  fieldSets,
  name,
  lockedCategory,
  batch = false,
  onApply,
  onBusyChange,
}: Props) {
  const [text, setText] = useState("");
  const [category, setCategory] = useState<ProductCategory | "auto">(lockedCategory ?? "auto");
  const [search, setSearch] = useState(true);
  const [replace, setReplace] = useState(false);
  const [state, setState] = useState<AiActionState>({ ok: true, message: "" });
  const [selected, setSelected] = useState<boolean[]>([]);
  const [pending, start] = useTransition();
  const running = useRef(false);
  function run(save = false) {
    if (running.current) return;
    running.current = true;
    onBusyChange?.(true);
    const request = { text: text.trim() || name || "", search, category, limit: batch ? 10 : 1 };
    const drafts = state.products?.filter((_, index) => selected[index]);
    start(async () => {
      try {
        const result = save
          ? await saveAiDraftsAction(drafts)
          : await suggestProductsAction(request);
        if (save && !result.ok)
          setState((previous) => ({ ...previous, ok: false, message: result.message }));
        else setState(result);
        if (result.products) setSelected(result.products.map(() => true));
      } catch {
        setState((previous) => ({
          ...previous,
          ok: false,
          message:
            "No se pudo conectar. Conservamos el texto y la propuesta para que puedas revisar e intentar otra vez.",
        }));
      } finally {
        running.current = false;
        onBusyChange?.(false);
      }
    });
  }
  function edit(index: number, key: "name" | "brand", value: string) {
    setState((previous) => ({
      ...previous,
      products: previous.products?.map((product, position) =>
        position === index ? { ...product, [key]: value } : product,
      ),
    }));
  }
  return (
    <section className="product-ai" aria-busy={pending}>
      <div className="product-editor__section-title">
        <span className="mono">IA</span>
        <div>
          <h2>{batch ? "Cargá varios productos con Claude" : "Completar con Claude"}</h2>
          <p>
            {batch
              ? "Pegá una lista o fichas de hasta 10 productos. Revisá las propuestas y elegí cuáles guardar como borradores."
              : "Pegá la referencia exacta, una descripción o la ficha del fabricante. También podés usar el nombre que ya escribiste abajo."}
          </p>
        </div>
      </div>
      {!configured ? (
        <p className="product-editor__message" role="status">
          Claude todavía no está activado en este servidor. Configurá ANTHROPIC_API_KEY como
          variable privada; podés continuar cargando productos manualmente.
        </p>
      ) : (
        <>
          <fieldset disabled={pending} className="product-ai__controls">
            <label>
              Datos para Claude
              <textarea
                value={text}
                maxLength={30000}
                rows={batch ? 8 : 4}
                placeholder={
                  batch
                    ? "Un producto por línea, con su modelo exacto. Podés incluir sus especificaciones."
                    : "Ejemplo: Ryzen 5 9600X. Pegá debajo la ficha del fabricante si la tenés."
                }
                onChange={(event) => {
                  setText(event.target.value);
                  setState({ ok: true, message: "" });
                }}
              />
            </label>
            <div className="product-editor__fields">
              {!lockedCategory && (
                <label>
                  Categoría para la IA
                  <select
                    value={category}
                    onChange={(event) => {
                      setCategory(event.target.value as ProductCategory | "auto");
                      setState({ ok: true, message: "" });
                    }}
                  >
                    <option value="auto">Detectar automáticamente</option>
                    {categories.map((item) => (
                      <option key={item.key} value={item.key}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={search}
                  onChange={(event) => {
                    setSearch(event.target.checked);
                    setState({ ok: true, message: "" });
                  }}
                />
                Buscar fuentes en la web
              </label>
            </div>
            <p className="small muted">
              Se envía este texto a tu cuenta de Claude. Los datos que no se puedan respaldar quedan
              pendientes. Las consultas y búsquedas consumen tu saldo de API.
            </p>
            <button
              className="button button--ghost"
              type="button"
              disabled={pending || !(text.trim() || name?.trim())}
              onClick={() => run()}
            >
              {pending
                ? "Claude está preparando las fichas…"
                : batch
                  ? "Preparar propuestas con IA"
                  : "Analizar y proponer ficha"}
            </button>
          </fieldset>
          {!!state.products?.length && (
            <div className="product-ai__results">
              {!batch && (
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={replace}
                    disabled={pending}
                    onChange={(event) => setReplace(event.target.checked)}
                  />
                  Reemplazar campos ya completados de identificación y ficha técnica
                </label>
              )}
              {state.products.map((product, index) => (
                <article key={index} className="product-ai__proposal">
                  {batch && (
                    <label className="check-label">
                      <input
                        type="checkbox"
                        checked={!!selected[index]}
                        disabled={pending}
                        onChange={(event) =>
                          setSelected((previous) =>
                            previous.map((value, position) =>
                              position === index ? event.target.checked : value,
                            ),
                          )
                        }
                      />
                      Guardar este producto como borrador
                    </label>
                  )}
                  <h3>{product.name}</h3>
                  <p className="small muted">
                    {categories.find((item) => item.key === product.category)?.label} ·{" "}
                    {product.brand || "Marca por identificar"} ·{" "}
                    {Object.keys(product.fields).length} especificaciones propuestas
                  </p>
                  {batch && (
                    <div className="product-editor__fields">
                      <label>
                        Nombre propuesto
                        <input
                          value={product.name}
                          maxLength={180}
                          disabled={pending}
                          onChange={(event) => edit(index, "name", event.target.value)}
                        />
                      </label>
                      <label>
                        Marca propuesta
                        <input
                          value={product.brand}
                          maxLength={60}
                          disabled={pending}
                          onChange={(event) => edit(index, "brand", event.target.value)}
                        />
                      </label>
                    </div>
                  )}
                  {product.source && (
                    <a
                      className="text-link small"
                      href={product.source}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Revisar fuente ↗
                    </a>
                  )}
                  <details>
                    <summary>Revisar especificaciones propuestas</summary>
                    <dl className="product-ai__specs">
                      {Object.entries(product.fields).map(([path, value]) => (
                        <div key={path}>
                          <dt>
                            {fieldSets[product.category].find((field) => field.path === path)
                              ?.label ?? path}
                          </dt>
                          <dd>{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </details>
                  {!!product.notes.length && (
                    <ul className="product-ai__notes">
                      {product.notes.map((note, position) => (
                        <li key={position}>{note}</li>
                      ))}
                    </ul>
                  )}
                  {!batch && (
                    <button
                      className="button"
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        const error = onApply?.(product, replace);
                        if (error) {
                          setState((previous) => ({ ...previous, ok: false, message: error }));
                          return;
                        }
                        setState({
                          ok: true,
                          message:
                            "Propuesta aplicada al formulario. Revisá los datos y guardá cuando esté lista; no se publicaron cambios automáticamente.",
                        });
                      }}
                    >
                      {replace ? "Reemplazar identificación y ficha" : "Aplicar a campos vacíos"}
                    </button>
                  )}
                </article>
              ))}
              {batch && (
                <button
                  className="button"
                  type="button"
                  disabled={pending || !selected.some(Boolean)}
                  onClick={() => run(true)}
                >
                  {pending
                    ? "Guardando…"
                    : `Guardar ${selected.filter(Boolean).length} borradores seleccionados`}
                </button>
              )}
            </div>
          )}
          {!!state.imported && (
            <Link className="button button--ghost" href="/admin/componentes">
              Revisar productos guardados
            </Link>
          )}
        </>
      )}
      {state.message && (
        <p className="product-editor__message" role={state.ok ? "status" : "alert"}>
          {state.message}
        </p>
      )}
    </section>
  );
}
