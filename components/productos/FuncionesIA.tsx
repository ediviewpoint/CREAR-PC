"use client";
import { useState } from "react";
import { DropdownMenu, Dialog } from "radix-ui";
import { Sparkles } from "lucide-react";
import type { ProductInput } from "@/lib/productos/schema";
type Found = {
  encontrado: boolean;
  specs: {
    campo: string;
    valor: string;
    fuenteUrl?: string | null;
    confianza: "alta" | "media" | "baja";
  }[];
  fuentes: string[];
  sugerencias: string[];
  variantes: { nombre: string; diferencias: string[] }[];
  aviso?: string;
};
export function FuncionesIA({
  getProduct,
  onApply,
}: {
  getProduct: () => ProductInput;
  onApply: (value: ProductInput) => void;
}) {
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [found, setFound] = useState<Found | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  async function run(func: string, model?: string) {
    const product = structuredClone(getProduct());
    if (
      func !== "specs-por-modelo" &&
      !window.confirm(
        "¿Aplicar la propuesta de IA sobre los campos de esta función? Se conservarán los demás datos.",
      )
    )
      return;
    setBusy(func);
    setError("");
    try {
      const response = await fetch(`/api/ia/${func}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          func === "specs-por-modelo"
            ? {
                marca: product.marca,
                modelo: model || product.modelo,
                partNumber: product.partNumber,
                categoria: product.categoriaNombre,
              }
            : {
                productoParcial: {
                  titulo: product.titulo,
                  marca: product.marca,
                  modelo: product.modelo,
                  categoriaNombre: product.categoriaNombre,
                  categoriaId: product.categoriaId,
                  specs: product.specs,
                  etiquetas: product.etiquetas,
                  puntosClave: product.puntosClave,
                },
                titulos: product.puntosClave.map((v) => v.titulo),
              },
        ),
        signal: AbortSignal.timeout(47000),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || "La función no pudo completarse");
      if (func === "specs-por-modelo") {
        setFound(result);
        setSelected(
          result.specs
            .map((s: Found["specs"][number], i: number) =>
              product.specs.some((v) => v.campo.toLowerCase() === s.campo.toLowerCase() && v.valor)
                ? -1
                : i,
            )
            .filter((i: number) => i >= 0),
        );
        return;
      }
      if (result.destacados) product.destacados = result.destacados;
      if (result.puntos)
        product.puntosClave = result.puntos.map((v: { titulo: string; descripcion: string }) => ({
          ...v,
          enPdf: true,
          origen: "IA_GENERADO" as const,
        }));
      if (result.descripcionHtml) product.descripcion = result.descripcionHtml;
      if (result.titulo) {
        product.titulo = result.titulo;
        product.tituloManual = true;
      }
      if (result.etiquetas) product.etiquetas = result.etiquetas;
      if (result.categoriaId) {
        product.categoriaId = result.categoriaId;
        product.subcategoriaId = result.subcategoriaId || null;
      }
      if (result.specs) product.specs = result.specs;
      onApply(product);
    } catch (error) {
      setError(error instanceof Error ? error.message : "No se pudo completar");
    } finally {
      setBusy("");
    }
  }
  function apply(all = false) {
    if (!found) return;
    const product = structuredClone(getProduct());
    for (const [i, spec] of found.specs.entries()) {
      if (!all && !selected.includes(i)) continue;
      const row = {
        campo: spec.campo,
        valor: spec.valor,
        fuenteUrl: spec.fuenteUrl || undefined,
        origen: "BUSQUEDA_MODELO" as const,
        confianza: spec.confianza.toUpperCase() as "ALTA" | "MEDIA" | "BAJA",
        confirmado: spec.confianza !== "baja",
      };
      const index = product.specs.findIndex(
        (v) => v.campo.toLowerCase() === spec.campo.toLowerCase(),
      );
      if (index < 0) product.specs.push(row);
      else product.specs[index] = row;
    }
    product.requiereRevision = product.specs.some((v) => v.confianza === "BAJA" && !v.confirmado);
    onApply(product);
    setFound(null);
  }
  return (
    <div className="elite-ai-functions">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button type="button" className="elite-button secondary" disabled={!!busy}>
            <Sparkles size={15} />
            {busy ? "Procesando IA" : "Funciones IA"}
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content className="elite-dropdown">
            {Object.entries({
              "specs-por-modelo": "Buscar specs por modelo",
              destacados: "Generar puntos destacados",
              "puntos-clave": "Generar puntos clave",
              titulo: "Mejorar título",
              descripcion: "Generar descripción",
              etiquetas: "Sugerir etiquetas",
              categoria: "Sugerir categoría",
              traducir: "Traducir specs al español",
            }).map(([key, label]) => (
              <DropdownMenu.Item key={key} onSelect={() => void run(key)}>
                {label}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      <button
        type="button"
        className="elite-button secondary"
        disabled={!!busy}
        onClick={() => void run("specs-por-modelo")}
      >
        Buscar specs reales por modelo
      </button>
      {error && <p role="alert">{error}</p>}
      <Dialog.Root
        open={!!found}
        onOpenChange={(open) => {
          if (!open) setFound(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="elite-overlay" />
          <Dialog.Content className="elite-search-dialog">
            <Dialog.Title>
              Specs encontradas para {getProduct().marca} {getProduct().modelo}
            </Dialog.Title>
            <Dialog.Description>
              {found?.aviso || "Compara los valores y aplica solo los que hayas revisado."}
            </Dialog.Description>
            {found && !found.encontrado && <p>No encontramos ese modelo exacto.</p>}
            {found?.sugerencias.map((model) => (
              <button key={model} onClick={() => void run("specs-por-modelo", model)}>
                {model}
              </button>
            ))}
            {found?.variantes.map((v) => (
              <p key={v.nombre}>
                {v.nombre}: {v.diferencias.join(", ")}
              </p>
            ))}
            {!found?.variantes.length &&
              found?.specs.map((spec, i) => (
                <label className="elite-spec-compare" key={i}>
                  <input
                    type="checkbox"
                    checked={selected.includes(i)}
                    onChange={(event) =>
                      setSelected((v) =>
                        event.target.checked ? [...v, i] : v.filter((n) => n !== i),
                      )
                    }
                  />
                  <span>
                    {spec.campo}
                    <small>
                      Actual:{" "}
                      {getProduct().specs.find((v) => v.campo === spec.campo)?.valor || "Vacío"}
                    </small>
                    <strong>{spec.valor}</strong>
                  </span>
                </label>
              ))}
            {found?.fuentes.map((url) => (
              <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                Fuente del fabricante{" "}
              </a>
            ))}
            <div className="elite-toolbar">
              <button
                className="elite-button"
                disabled={!found?.encontrado || !!found.variantes.length}
                onClick={() => apply()}
              >
                Aplicar seleccionadas
              </button>
              <button
                className="elite-button secondary"
                disabled={!found?.encontrado || !!found.variantes.length}
                onClick={() => {
                  if (window.confirm("¿Reemplazar todas las specs encontradas?")) apply(true);
                }}
              >
                Aplicar todas
              </button>
              <Dialog.Close className="elite-button secondary">Cancelar</Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
