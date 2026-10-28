"use client";
import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { CaseDrawing, CASE_PART_OFFSETS } from "@/components/visuals/CaseDrawing";
import { HardwareIcon } from "@/components/icons";
import type { HardwareKind } from "@/components/icons";
import type { SelectedComponent } from "@/lib/catalog/types";
import { CATEGORIES } from "@/lib/catalog/types";
import { PreviewBrand } from "./PreviewBrand";
type ViewMode = "assembled" | "exploded" | "categories";
const points: Record<
  HardwareKind,
  { node: [number, number]; target: [number, number]; short: string }
> = {
  cpu: { node: [69, 85], target: [273, 204], short: "CPU" },
  mobo: { node: [65, 205], target: [240, 275], short: "PLACA" },
  ram: { node: [482, 109], target: [315, 215], short: "RAM" },
  gpu: { node: [449, 421], target: [310, 338], short: "GPU" },
  storage: { node: [490, 336], target: [272, 313], short: "SSD" },
  psu: { node: [113, 421], target: [290, 390], short: "FUENTE" },
  case: { node: [64, 318], target: [164, 307], short: "CHASIS" },
  cooler: { node: [483, 223], target: [291, 239], short: "COOLER" },
};
export function BuildPreview({
  selected,
  active,
  onCategory,
  onChoose,
}: {
  selected: SelectedComponent[];
  active: HardwareKind;
  onCategory: (index: number) => void;
  onChoose?: () => void;
}) {
  const [mode, setMode] = useState<ViewMode>("assembled"),
    [expanded, setExpanded] = useState(false),
    [showBrands, setShowBrands] = useState(true);
  const installed = selected.map((s) => s.component.category),
    count = new Set(installed).size;
  const current = selected.find((s) => s.component.category === active),
    title = CATEGORIES.find((c) => c.key === active)!.label;
  const exploded = mode === "exploded";
  return (
    <section
      className="build-preview build-preview--interactive preview-studio"
      aria-label="Vista conceptual de tu equipo"
      data-preview-adapter="svg"
      data-expanded={expanded}
      data-mode={mode}
    >
      <header className="build-preview__top">
        <div className="preview-title">
          <span className="preview-ring" aria-hidden="true">
            <svg viewBox="0 0 44 44">
              <circle cx="22" cy="22" r="18" />
              <circle
                className="preview-ring__fill"
                cx="22"
                cy="22"
                r="18"
                pathLength="100"
                strokeDasharray={(count / 8) * 100 + " 100"}
              />
            </svg>
            <span>{String(count).padStart(2, "0")}</span>
          </span>
          <div>
            <p className="eyebrow">ELITEPC / Tu equipo, por dentro</p>
            <h2>Tu PC toma forma.</h2>
            <span className="mono">{String(count).padStart(2, "0")} de 08 categorías</span>
          </div>
        </div>
        <button
          type="button"
          className="preview-toggle"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Ocultar vista" : "Mostrar vista"}
        </button>
      </header>
      <div className="build-preview__scene">
        <div className="preview-toolbar">
          <div className="preview-modes" role="group" aria-label="Modo de vista">
            {[
              { id: "assembled", label: "Ensamblado" },
              { id: "exploded", label: "Por piezas" },
              { id: "categories", label: "Categorías" },
            ].map((v) => (
              <button
                key={v.id}
                type="button"
                aria-pressed={mode === v.id}
                onClick={() => setMode(v.id as ViewMode)}
              >
                {v.label}
              </button>
            ))}
          </div>
          <label className="preview-brand-switch">
            <input
              type="checkbox"
              checked={showBrands}
              onChange={(e) => setShowBrands(e.target.checked)}
            />
            Marcas
          </label>
        </div>
        {mode !== "categories" && (
          <div className="preview-canvas">
            <div className="preview-canvas__index">
              <span className="mono">{exploded ? "02 / DESPIECE" : "01 / ENSAMBLADO"}</span>
              <span>Seleccioná una zona</span>
            </div>
            <div className="preview-stage">
              <CaseDrawing
                installed={installed}
                active={active}
                exploded={exploded}
                label={
                  "Vista conceptual " +
                  (exploded ? "por piezas" : "ensamblada") +
                  ". " +
                  title +
                  ": " +
                  (current ? current.component.name : "sin seleccionar")
                }
              />
              <svg className="preview-guides" viewBox="0 0 560 500" fill="none" aria-hidden="true">
                {CATEGORIES.map((c) => {
                  const p = points[c.key],
                    offset = exploded ? CASE_PART_OFFSETS[c.key] : [0, 0];
                  return (
                    <g key={c.key} data-active={active === c.key}>
                      <path
                        d={
                          "M" +
                          p.node[0] +
                          " " +
                          p.node[1] +
                          " L" +
                          (p.target[0] + offset[0]!) +
                          " " +
                          (p.target[1] + offset[1]!)
                        }
                      />
                      <circle cx={p.target[0] + offset[0]!} cy={p.target[1] + offset[1]!} r="3" />
                    </g>
                  );
                })}
              </svg>
              {CATEGORIES.map((c, i) => (
                <button
                  key={c.key}
                  className="preview-hotspot"
                  type="button"
                  style={{
                    left: (points[c.key].node[0] / 560) * 100 + "%",
                    top: (points[c.key].node[1] / 500) * 100 + "%",
                  }}
                  aria-label={"Ver " + c.label + " en la vista"}
                  aria-pressed={active === c.key}
                  data-installed={installed.includes(c.key)}
                  onClick={() => onCategory(i)}
                >
                  <HardwareIcon kind={c.key} />
                  <span>{points[c.key].short}</span>
                </button>
              ))}
            </div>
            <div className="preview-legend">
              <span>
                <i aria-hidden="true" />
                Seleccionado
              </span>
              <span>
                <i className="preview-legend__pending" aria-hidden="true" />
                Por elegir
              </span>
            </div>
          </div>
        )}
        <div className="preview-board-heading">
          <span className="eyebrow">
            {mode === "categories" ? "Tu configuración / Categorías" : "Las piezas de tu equipo"}
          </span>
          <span className="small muted">{8 - count} por elegir</span>
        </div>
        <nav
          className="preview-parts preview-category-grid"
          aria-label="Explorar piezas del dibujo"
        >
          {CATEGORIES.map((c, i) => {
            const row = selected.find((s) => s.component.category === c.key);
            return (
              <button
                key={c.key}
                type="button"
                aria-current={active === c.key ? "step" : undefined}
                aria-label={c.label + (row ? ", seleccionado" : ", por elegir")}
                aria-describedby={row ? "preview-model-" + c.key : undefined}
                data-installed={!!row}
                onClick={() => onCategory(i)}
              >
                <span className="preview-category-grid__head">
                  <span className="preview-category-icon">
                    <HardwareIcon kind={c.key} />
                  </span>
                  <strong>{c.label}</strong>
                  <span className="preview-part-state" aria-hidden="true">
                    {row ? "✓" : String(i + 1).padStart(2, "0")}
                  </span>
                </span>
                {row ? (
                  <>
                    {showBrands && <PreviewBrand component={row.component} />}
                    <span
                      className="preview-category-model"
                      id={"preview-model-" + c.key}
                      title={row.component.name}
                    >
                      {row.component.name}
                    </span>
                    <span className="preview-category-status">
                      {row.owned ? "Pieza propia" : "Seleccionado"}
                      {(row.quantity ?? 1) > 1 ? " · " + row.quantity + " unidades" : ""}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="preview-category-empty">Tu próxima elección</span>
                    <span className="preview-category-status">Elegir componente ↗</span>
                  </>
                )}
              </button>
            );
          })}
        </nav>
      </div>
      <div className="preview-focus" aria-live="polite">
        <div className="preview-inspector-heading">
          <div>
            <span className="eyebrow">En foco / {title}</span>
            <strong>{current ? current.component.name : "Todavía no elegiste esta pieza."}</strong>
          </div>
          {current && showBrands ? (
            <PreviewBrand component={current.component} large />
          ) : (
            <HardwareIcon kind={active} />
          )}
        </div>
        {current ? (
          <>
            <div className="preview-inspector-specs">
              {current.component.specs.slice(0, 3).map((s) => (
                <span key={s.label}>
                  <small>{s.label}</small>
                  <strong>{s.value}</strong>
                </span>
              ))}
            </div>
            <div className="preview-inspector-actions">
              <button
                type="button"
                className="button button--ghost"
                onClick={
                  onChoose ?? (() => onCategory(CATEGORIES.findIndex((c) => c.key === active)))
                }
              >
                Cambiar pieza ↗
              </button>
              <Link
                className="text-link small"
                href={
                  ("/catalog/" + current.component.category + "/" + current.component.slug) as Route
                }
              >
                Ver ficha
              </Link>
              <span className="small muted">
                {current.owned
                  ? "Pieza propia · incluida en la vista"
                  : "Incluida en tu configuración"}
              </span>
            </div>
          </>
        ) : (
          <div className="preview-inspector-actions">
            <button
              type="button"
              className="button"
              onClick={
                onChoose ?? (() => onCategory(CATEGORIES.findIndex((c) => c.key === active)))
              }
            >
              Elegir {title.toLowerCase()} ↗
            </button>
            <span className="small muted">Elegí una opción para incorporarla al dibujo.</span>
          </div>
        )}
      </div>
      <p className="preview-disclaimer">
        Ubicación conceptual, sin escala ni geometría exacta del modelo. La compatibilidad se revisa
        por separado.
      </p>
    </section>
  );
}
