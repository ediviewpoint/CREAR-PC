"use client";
import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { QuoteDialog } from "./QuoteDialog";
import { saveBuildForQuoteAction } from "@/app/_actions/build";
import type { QuoteBuildInput } from "@/lib/schemas/quote";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { CatalogComponent, SelectedComponent } from "@/lib/catalog/types";
import { CATEGORIES } from "@/lib/catalog/types";
import { toBuildView, isCompleteBuild } from "@/lib/catalog/build";
import { evaluateBuild } from "@/lib/compat/evaluate";
import { formatBob } from "@/lib/utils/format";
import { HardwareIcon } from "@/components/icons";
import { BuildPreview } from "./BuildPreview";
import { ComponentCard } from "@/components/catalog/ComponentCard";
import { useBuildWizard } from "./useBuildWizard";
import { CATEGORY_GUIDE } from "./category-guide";
import { readDraft, writeDraft } from "./local-draft";
import { RouteLoading } from "@/components/layout/RouteLoading";
import type { ProformaData } from "@/lib/proforma/types";
const subscribe = () => () => {};
export function BuildWorkbench(props: Parameters<typeof WorkbenchContent>[0]) {
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  if (!ready) return <RouteLoading />;
  return (
    <WorkbenchContent key={`${props.initialId ?? "local"}:${props.initialSlug ?? ""}`} {...props} />
  );
}

function WorkbenchContent({
  catalog,
  existing = false,
  initialSlug,
  initialSelected,
  initialId,
  initialName,
  initialPublic,
}: {
  catalog: CatalogComponent[];
  existing?: boolean;
  initialSlug?: string;
  initialSelected?: SelectedComponent[];
  initialId?: string;
  initialName?: string;
  initialPublic?: boolean;
}) {
  const initial = catalog.find((c) => c.slug === initialSlug);
  const [draft] = useState(() => (initialSelected ? null : readDraft(catalog)));
  const [selected, setSelected] = useState<SelectedComponent[]>(() => {
    if (initialSelected) return initialSelected;
    const rows = draft?.selected ?? [];
    if (!initial) return rows;
    const same = rows.find((row) => row.component.slug === initial.slug);
    return [
      ...rows.filter((row) => row.component.category !== initial.category),
      same ?? { component: initial, owned: existing },
    ];
  });
  const [owned, setOwned] = useState(existing);
  const [name, setName] = useState(initialName ?? draft?.name ?? "Mi nueva PC");
  const [savedId, setSavedId] = useState(initialId);
  const [publicBuild, setPublicBuild] = useState(initialPublic ?? false);
  const [saving, startSave] = useTransition();
  const [search, setSearch] = useState("");
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [revision, setRevision] = useState(0);
  const [saveError, setSaveError] = useState("");
  const [selectionMessage, setSelectionMessage] = useState("");
  const [undo, setUndo] = useState<SelectedComponent[] | null>(null);
  useEffect(() => {
    try {
      writeDraft(name, selected);
    } catch {
      /* Explicit save reports storage failures. */
    }
  }, [name, selected]);
  const wizard = useBuildWizard(
    CATEGORIES.length,
    Math.max(
      0,
      CATEGORIES.findIndex((c) => c.key === initial?.category),
    ),
    () => {
      setSearch("");
      setCandidateIndex(0);
    },
  );
  const reduced = useReducedMotion();
  const router = useRouter();
  const heading = useRef<HTMLHeadingElement>(null);
  const summaryHeading = useRef<HTMLHeadingElement>(null);
  const undoButton = useRef<HTMLButtonElement>(null);
  const category = CATEGORIES[wizard.step] ?? CATEGORIES[0]!;
  const guide = CATEGORY_GUIDE[category.key];
  const currentPart = selected.find((s) => s.component.category === category.key);
  const missing = CATEGORIES.filter((c) => !selected.some((s) => s.component.category === c.key));
  const build = toBuildView(selected),
    compat = evaluateBuild(build);
  const complete = isCompleteBuild(build),
    pendingPrices = selected.some((s) => !s.owned && s.component.priceBob === null);
  const canQuote = complete && compat.ok && !pendingPrices && selected.some((s) => !s.owned);
  const toBuy = selected.filter((row) => !row.owned);
  const priced = toBuy.filter((row) => row.component.priceBob !== null).length;
  const quoteInput: QuoteBuildInput = {
    id: savedId,
    name: name.trim() || "Mi nueva PC",
    isPublic: publicBuild,
    items: selected.map((s) => ({
      componentId: s.component.id,
      owned: s.owned,
      quantity: s.quantity ?? 1,
      offerId: s.owned ? undefined : s.component.offerId,
    })),
  };

  function storeLocal() {
    writeDraft(name, selected);
  }
  function restore() {
    try {
      const data = readDraft(catalog);
      if (!data) throw new Error("No draft");
      setName(data.name);
      setUndo(selected);
      setSelected(data.selected);
      setSaveError("Selección recuperada. Precios y fichas se actualizaron desde el catálogo.");
    } catch {
      setSaveError("No hay una selección válida guardada en esta pestaña.");
    }
  }
  function save() {
    try {
      storeLocal();
    } catch {
      setSaveError("No se pudo guardar en esta pestaña.");
      return;
    }
    if (selected.some((s) => s.component.source !== "database")) {
      setSaveError(
        "Selección guardada en esta pestaña. El guardado en línea necesita la conexión del catálogo.",
      );
      return;
    }
    startSave(async () => {
      try {
        const result = await saveBuildForQuoteAction(quoteInput);
        if (result.ok) {
          setSavedId(result.buildId);
          setSaveError("Build guardado en esta sesión.");
        } else setSaveError(result.message);
      } catch {
        setSaveError("No se pudo guardar en línea. Tu selección sigue disponible en esta pestaña.");
      }
    });
  }
  const visible = catalog.filter(
    (c) => c.category === category.key && c.name.toLowerCase().includes(search.toLowerCase()),
  );
  const candidate = Math.min(candidateIndex, Math.max(visible.length - 1, 0));
  const pageStart = Math.floor(candidate / 6) * 6;
  const pageItems = visible.slice(pageStart, pageStart + 6);
  const psu = build.psu?.spec.wattage ?? 0;
  const powerRatio = psu ? Math.min(100, (compat.recommendedPsuW / psu) * 100) : 0;
  function pick(c: CatalogComponent, focusUndo = false) {
    setUndo(selected);
    const previous = selected.find((s) => s.component.category === c.category);
    setSelectionMessage(
      previous?.component.id === c.id
        ? `${c.name} se quitó de tu equipo.`
        : `${c.name} ${previous ? "reemplaza a " + previous.component.name : "se añadió a tu equipo"}.`,
    );
    setSelected((current) =>
      current.some((s) => s.component.id === c.id)
        ? current.filter((s) => s.component.id !== c.id)
        : [...current.filter((s) => s.component.category !== c.category), { component: c, owned }],
    );
    setRevision((n) => n + 1);
    setSaveError("");
    if (focusUndo) requestAnimationFrame(() => undoButton.current?.focus({ preventScroll: true }));
  }
  function navigate(index: number) {
    wizard.goTo(index);
    setSearch("");
    requestAnimationFrame(() => {
      heading.current?.focus({ preventScroll: true });
      heading.current?.scrollIntoView({ behavior: reduced ? "instant" : "smooth", block: "start" });
    });
  }
  function generate() {
    if (!complete || !compat.ok || !selected.some((s) => !s.owned)) return;
    const now = new Date();
    const until = new Date(now);
    until.setDate(until.getDate() + 7);
    const data: ProformaData = {
      id: "local",
      code: "BORRADOR",
      draft: true,
      example: false,
      name: name.trim() || "Mi nueva PC",
      client: { name: "Por completar" },
      issuer: { name: "ELITEPC", city: "Santa Cruz, Bolivia" },
      issuedAt: now.toISOString().slice(0, 10),
      validUntil: until.toISOString().slice(0, 10),
      items: CATEGORIES.flatMap((category) =>
        selected.filter((row) => row.component.category === category.key),
      )
        .filter((s) => !s.owned)
        .map((s) => ({
          category:
            CATEGORIES.find((c) => c.key === s.component.category)?.label ?? s.component.category,
          name: s.component.name,
          quantity: s.quantity ?? 1,
          unitPriceBob: s.component.priceBob ?? 0,
          pricePending: s.component.priceBob === null,
        })),
      discountBob: 0,
      terms: [
        "Precios en Bolivianos. Sujetos a disponibilidad de stock.",
        "Validez: 7 días calendario desde la emisión.",
        "No es factura. No habilita crédito fiscal.",
        "Montaje y entrega no incluidos salvo indicación expresa.",
        "ELITEPC: piezas 3 meses; procesador 12 meses. Sin limitar derechos legales ni garantías adicionales aplicables.",
      ],
    };
    try {
      storeLocal();
      sessionStorage.setItem("crearpc.proforma.local", JSON.stringify(data));
      router.push("/proforma/local");
    } catch {
      setSaveError(
        "No se pudo preparar el borrador. Habilitá el almacenamiento de esta pestaña y volvé a intentar.",
      );
    }
  }
  return (
    <main id="main" className="workbench shell">
      <header className="workbench__header">
        <div>
          <p className="eyebrow">Tu mesa de trabajo</p>
          <h1>Cada pieza cuenta.</h1>
          <p className="workbench-intro">
            Elegí tus componentes, sumá los que ya tenés y revisá cómo encaja todo.
          </p>
        </div>
        <label className="build-name">
          Nombre del build
          <input value={name} maxLength={120} onChange={(e) => setName(e.target.value)} />
        </label>
      </header>
      <div className="proforma-toolbar">
        <button
          className="button button--ghost"
          type="button"
          onClick={() => {
            setUndo(selected);
            setSelected(catalog.map((component) => ({ component, owned: false, quantity: 1 })));
            setSelectionMessage(
              "Equipo de prueba cargado. Podés deshacer este cambio desde el resumen.",
            );
            setRevision((n) => n + 1);
            setSaveError("");
          }}
        >
          Cargar equipo de prueba
        </button>
        <span className="small muted">
          Una pieza por categoría. Los precios se cotizan por separado.
        </span>
      </div>
      <section className="assembly-progress" aria-label="Progreso de tu equipo">
        <div>
          <span className="eyebrow">Tu equipo, pieza por pieza</span>
          <strong>
            {selected.length}
            <span> / {CATEGORIES.length}</span>
          </strong>
          <span className="small muted">
            {missing.length
              ? `${missing.length} categorías pendientes`
              : "Todas las categorías seleccionadas"}
          </span>
        </div>
        <div className="assembly-progress__track" aria-hidden="true">
          {CATEGORIES.map((c) => (
            <span key={c.key} data-filled={selected.some((s) => s.component.category === c.key)} />
          ))}
        </div>
        <button
          className="text-link small"
          type="button"
          onClick={() =>
            missing.length
              ? navigate(CATEGORIES.findIndex((c) => c.key === missing[0]!.key))
              : document
                  .getElementById("build-summary")
                  ?.scrollIntoView({ behavior: reduced ? "instant" : "smooth" })
          }
        >
          {missing.length ? "Elegir próxima pieza →" : "Revisar mi equipo →"}
        </button>
      </section>
      <div className="wizard-progress">
        <div>
          <span>
            Paso {wizard.step + 1} de {CATEGORIES.length}
          </span>
          <span>{category.label}</span>
        </div>
        <progress
          value={wizard.step + 1}
          max={CATEGORIES.length}
          aria-label="Progreso de categorías"
        />
      </div>
      <div className="workbench__grid">
        <nav className="category-rail" aria-label="Categorías del build">
          {CATEGORIES.map((c, i) => (
            <button
              key={c.key}
              type="button"
              aria-current={i === wizard.step ? "step" : undefined}
              onClick={() => navigate(i)}
            >
              <HardwareIcon kind={c.key} />
              <span>{c.label}</span>
              <span
                className="category-rail__state"
                aria-label={
                  selected.some((s) => s.component.category === c.key)
                    ? "Seleccionado"
                    : "Sin seleccionar"
                }
              >
                {selected.some((s) => s.component.category === c.key)
                  ? "✓"
                  : String(i + 1).padStart(2, "0")}
              </span>
            </button>
          ))}
        </nav>
        <div className="workbench__center">
          <div className="category-toolbar" id="component-selector">
            <div>
              <p className="eyebrow">Elegí tu próxima pieza</p>
              <h2 tabIndex={-1} ref={heading}>
                {category.label}
              </h2>
              <p className="category-purpose">{guide.purpose}</p>
            </div>
            <label className="owned-switch">
              <input type="checkbox" checked={owned} onChange={(e) => setOwned(e.target.checked)} />
              Ya lo tengo
            </label>
          </div>
          <div className="category-guide">
            <HardwareIcon kind={category.key} />
            <p>
              <strong>Antes de elegir</strong>
              <span>{guide.check}</span>
            </p>
          </div>
          <p className="owned-explanation small muted">
            {owned
              ? "Elegí el modelo que ya tenés. Quedará fuera de la cotización."
              : "Esta pieza se añadirá a la lista de compra."}
          </p>
          <label className="search-label">
            Buscar en {category.label.toLowerCase()}
            <input
              type="search"
              value={search}
              placeholder="Marca o modelo"
              onChange={(e) => {
                setSearch(e.target.value);
                setCandidateIndex(0);
              }}
            />
          </label>
          <div className="selection-feedback" role="status" aria-live="polite" aria-atomic="true">
            {selectionMessage || "Tu selección aparecerá en la vista y en el resumen."}
          </div>
          <div
            className="category-viewport"
            onTouchStart={wizard.onTouchStart}
            onTouchEnd={wizard.onTouchEnd}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.section
                key={category.key}
                aria-label={category.label}
                initial={reduced ? false : { opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduced ? undefined : { opacity: 0, x: -8 }}
                transition={{ duration: reduced ? 0 : 0.32, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <div className="build-cards">
                  {pageItems.map((c, i) => (
                    <div
                      className="candidate-card"
                      data-current={pageStart + i === candidate}
                      key={c.id}
                    >
                      <ComponentCard
                        component={c}
                        selected={selected.some((s) => s.component.id === c.id)}
                        owned={selected.find((s) => s.component.id === c.id)?.owned ?? owned}
                        onSelect={() => pick(c)}
                        showBrand
                      />
                    </div>
                  ))}
                </div>
                {!visible.length && (
                  <div className="empty-state">
                    <HardwareIcon kind={category.key} />
                    <h3>
                      {search
                        ? "No hay coincidencias."
                        : "Todavía no hay fichas de esta categoría."}
                    </h3>
                    <p>
                      {search
                        ? "Buscá por marca o modelo, o volvé a ver todas las piezas de esta categoría."
                        : "Podés continuar explorando las otras piezas."}
                    </p>
                    {search && (
                      <button
                        className="button button--ghost"
                        type="button"
                        onClick={() => setSearch("")}
                      >
                        Limpiar búsqueda
                      </button>
                    )}
                  </div>
                )}
              </motion.section>
            </AnimatePresence>
          </div>
          {visible.length > 1 && (
            <>
              <div className="candidate-controls candidate-controls--mobile">
                <button
                  className="icon-button"
                  type="button"
                  aria-label="Pieza anterior"
                  disabled={candidate === 0}
                  onClick={() => setCandidateIndex(candidate - 1)}
                >
                  ←
                </button>
                <span className="small" role="status">
                  Pieza {candidate + 1} de {visible.length}
                </span>
                <button
                  className="icon-button"
                  type="button"
                  aria-label="Pieza siguiente"
                  disabled={candidate >= visible.length - 1}
                  onClick={() => setCandidateIndex(candidate + 1)}
                >
                  →
                </button>
              </div>
              <div className="candidate-controls candidate-controls--desktop">
                <button
                  className="button button--ghost"
                  type="button"
                  disabled={pageStart === 0}
                  onClick={() => setCandidateIndex(Math.max(0, pageStart - 6))}
                >
                  Página anterior
                </button>
                <span className="small">
                  {pageStart + 1}–{Math.min(pageStart + 6, visible.length)} de {visible.length}
                </span>
                <button
                  className="button button--ghost"
                  type="button"
                  disabled={pageStart + 6 >= visible.length}
                  onClick={() => setCandidateIndex(pageStart + 6)}
                >
                  Página siguiente
                </button>
              </div>
            </>
          )}
          <a className="mobile-summary-link" href="#build-summary">
            Ver mi equipo <span className="mono">{selected.length}/08 piezas ↗</span>
          </a>
          <div className="wizard-controls">
            <button
              className="button button--ghost"
              type="button"
              disabled={wizard.step === 0}
              onClick={() => navigate(wizard.step - 1)}
            >
              ← Anterior
            </button>
            {wizard.step < CATEGORIES.length - 1 ? (
              <button className="button" type="button" onClick={() => navigate(wizard.step + 1)}>
                {currentPart ? "Continuar" : "Elegir después"} →
              </button>
            ) : (
              <a className="button" href="#build-summary">
                Revisar equipo →
              </a>
            )}
          </div>
          <div className="assembly-preview-heading">
            <p className="eyebrow">Explorá tu equipo</p>
            <p className="small muted">La vista se actualiza con cada pieza que elegís.</p>
          </div>
          <BuildPreview
            selected={selected}
            active={category.key}
            onCategory={wizard.goTo}
            onChoose={() => navigate(wizard.step)}
          />
        </div>
        <motion.aside
          className="build-summary"
          id="build-summary"
          aria-label="Resumen del build"
          animate={!reduced && !compat.ok ? { x: [0, -2, 2, -2, 0] } : { x: 0 }}
          transition={{ duration: reduced ? 0 : 0.2 }}
        >
          {revision > 0 && !reduced && (
            <motion.div
              key={revision}
              className="summary-flash"
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.12, 0] }}
              transition={{ duration: 0.3 }}
            />
          )}
          <p className="eyebrow">Resumen / En tiempo real</p>
          <h2 ref={summaryHeading} tabIndex={-1}>
            {name || "Mi nueva PC"}
          </h2>
          {undo && (
            <button
              ref={undoButton}
              className="undo-selection button button--ghost"
              type="button"
              onClick={() => {
                setSelected(undo);
                setUndo(null);
                setSelectionMessage("Cambio deshecho. Recuperaste la selección anterior.");
                setRevision((n) => n + 1);
                requestAnimationFrame(() => summaryHeading.current?.focus({ preventScroll: true }));
              }}
            >
              ↶ Deshacer último cambio
            </button>
          )}
          <ul className="selected-parts">
            {selected.map((s) => (
              <li key={s.component.id}>
                <div>
                  <span>{s.component.name}</span>
                  <button
                    className="summary-edit text-link small"
                    type="button"
                    onClick={() =>
                      navigate(CATEGORIES.findIndex((c) => c.key === s.component.category))
                    }
                  >
                    Cambiar{" "}
                    {CATEGORIES.find((c) => c.key === s.component.category)?.label.toLowerCase()} ↗
                  </button>
                  <span className="small muted">
                    {s.owned
                      ? "Propio · fuera de cotización"
                      : s.component.priceBob === null
                        ? "Por cotizar"
                        : formatBob(s.component.priceBob * (s.quantity ?? 1))}
                  </span>
                  <label className="summary-owned small">
                    <input
                      type="checkbox"
                      checked={s.owned}
                      aria-label={`Ya tengo ${s.component.name}`}
                      onChange={(e) => {
                        const value = e.target.checked;
                        setSelected((rows) =>
                          rows.map((row) =>
                            row.component.id === s.component.id ? { ...row, owned: value } : row,
                          ),
                        );
                        setSelectionMessage(
                          `${s.component.name}: ${value ? "marcado como propio" : "añadido a la lista de compra"}.`,
                        );
                      }}
                    />{" "}
                    Ya lo tengo
                  </label>
                  {["ram", "storage"].includes(s.component.category) && (
                    <label className="small">
                      {s.component.category === "ram" ? "Cantidad de kits" : "Cantidad de unidades"}
                      <input
                        type="number"
                        min="1"
                        max="16"
                        value={s.quantity ?? 1}
                        aria-label={`Cantidad de ${s.component.name}`}
                        onChange={(event) => {
                          const quantity = Math.max(
                            1,
                            Math.min(16, Math.trunc(Number(event.target.value) || 1)),
                          );
                          setSelected((current) =>
                            current.map((row) =>
                              row.component.id === s.component.id ? { ...row, quantity } : row,
                            ),
                          );
                        }}
                      />
                    </label>
                  )}
                </div>
                <button
                  className="icon-button"
                  type="button"
                  aria-label={`Quitar ${s.component.name}`}
                  onClick={() => pick(s.component, true)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          {missing.length > 0 && (
            <div className="missing-parts">
              <p className="eyebrow">Te falta elegir</p>
              {missing.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => navigate(CATEGORIES.findIndex((row) => row.key === c.key))}
                >
                  <HardwareIcon kind={c.key} />
                  <span>{c.label}</span>
                  <span aria-hidden="true">+</span>
                </button>
              ))}
            </div>
          )}
          <label className="check-label small">
            <input
              type="checkbox"
              checked={publicBuild}
              onChange={(e) => setPublicBuild(e.target.checked)}
            />
            Permitir enlace público del build (sin datos del cliente).
          </label>
          {!selected.length && <p className="muted">Tu equipo empieza con la primera pieza.</p>}
          <div className="summary-block">
            <div className="summary-line">
              <span>Potencia con margen</span>
              <span className="mono">
                {compat.recommendedPsuW} W / {psu || "—"} W
              </span>
            </div>
            <div
              className="power-meter"
              role="meter"
              aria-label="Potencia con margen sobre capacidad de la fuente"
              aria-valuemin={0}
              aria-valuemax={Math.max(psu, compat.recommendedPsuW, 1)}
              aria-valuenow={compat.recommendedPsuW}
            >
              <span style={{ width: `${powerRatio}%` }} />
            </div>
            <p className="small muted">Consumo estimado {compat.totalTdpW} W + 30% de margen.</p>
          </div>
          <div className="summary-block" aria-live="polite">
            <div className="compat-status">
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                {compat.ok && complete ? (
                  <motion.path
                    d="m5 12 4 4 10-10"
                    initial={{ pathLength: reduced ? 1 : 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: reduced ? 0 : 0.5 }}
                  />
                ) : (
                  <path d={compat.ok ? "M12 5v9m0 3v2" : "m6 6 12 12M6 18 18 6"} />
                )}
              </svg>
              <strong>
                {!compat.ok
                  ? "Revisá estas piezas"
                  : complete
                    ? "Sin conflictos detectados"
                    : "Validación parcial"}
              </strong>
            </div>
            <p className="small muted">
              {!complete && "Faltan piezas para validar el equipo completo."}
            </p>
            <ul className="compat-issues">
              {compat.issues.map((issue) => (
                <li key={issue.code}>
                  <span className="issue-severity">
                    {issue.severity === "error"
                      ? "Revisar"
                      : issue.severity === "warning"
                        ? "Atención"
                        : "Información"}
                  </span>{" "}
                  {issue.messageEs}
                  <div className="issue-actions">
                    {[...new Set(issue.involved.map((part) => part.category))].map((key) => {
                      const index = CATEGORIES.findIndex(
                        (c) =>
                          c.key === key ||
                          (c.key === "cooler" && ["coolerAir", "coolerAio"].includes(key)),
                      );
                      return index < 0 ? null : (
                        <button
                          className="text-link small"
                          type="button"
                          key={key}
                          onClick={() => navigate(index)}
                        >
                          Revisar {CATEGORIES[index]!.label.toLowerCase()} ↗
                        </button>
                      );
                    })}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="summary-total">
            <span className="eyebrow">Total cotizado</span>
            <strong>
              {!selected.length ? "—" : pendingPrices ? "Por cotizar" : formatBob(compat.totalBob)}
            </strong>
          </div>
          <section className="quote-readiness" aria-label="Estado para cotizar">
            <h3>Antes de cotizar</h3>
            <ul>
              <li>
                <span aria-hidden="true">{complete ? "✓" : "○"}</span>
                <span>
                  Equipo esencial<strong>{complete ? "Completo" : "Faltan piezas"}</strong>
                </span>
              </li>
              <li>
                <span aria-hidden="true">{complete && compat.ok ? "✓" : "○"}</span>
                <span>
                  Compatibilidad
                  <strong>
                    {!compat.ok
                      ? "Resolver conflictos"
                      : complete
                        ? "Sin conflictos detectados"
                        : "Revisión parcial"}
                  </strong>
                </span>
              </li>
              <li>
                <span aria-hidden="true">{toBuy.length > 0 && !pendingPrices ? "✓" : "○"}</span>
                <span>
                  Precios de compra
                  <strong>
                    {toBuy.length
                      ? `${priced} de ${toBuy.length} piezas con precio`
                      : "Sin piezas por comprar"}
                  </strong>
                </span>
              </li>
            </ul>
            {complete && compat.ok && pendingPrices && (
              <p>
                Ya podés descargar un borrador. La proforma se habilita al contar con los precios de
                compra.
              </p>
            )}
          </section>
          <button
            className="button button--ghost"
            type="button"
            disabled={saving || !selected.length}
            onClick={save}
          >
            {saving ? "Guardando…" : "Guardar build"}
          </button>
          <button className="text-link small" type="button" onClick={restore}>
            Recuperar selección local
          </button>
          <QuoteDialog build={quoteInput} disabled={!canQuote || saving} onSaved={setSavedId} />
          <button
            className="text-link"
            type="button"
            disabled={!complete || !compat.ok || !selected.some((s) => !s.owned)}
            onClick={generate}
          >
            Preparar borrador local
          </button>
          {!canQuote && (
            <p className="small muted">
              {!compat.ok
                ? "Resolvé los conflictos para continuar."
                : !complete
                  ? "Completá las piezas esenciales para continuar."
                  : pendingPrices
                    ? "Faltan cotizaciones verificadas."
                    : "El build no tiene piezas para comprar."}
            </p>
          )}
          {canQuote && (
            <p className="small muted">Emití una proforma con las piezas que faltan comprar.</p>
          )}
          {savedId && (
            <a className="text-link small" href={`/build/${savedId}`}>
              Abrir build guardado ↗
            </a>
          )}
          {saveError && <p role="alert">{saveError}</p>}
        </motion.aside>
      </div>
    </main>
  );
}
