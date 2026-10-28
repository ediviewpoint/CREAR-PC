"use client";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { CATEGORIES } from "@/lib/catalog/types";
import type { CatalogComponent } from "@/lib/catalog/types";
import { formatBob } from "@/lib/utils/format";
import { ProductZoom } from "./ProductZoom";
import { PreviewBrand } from "@/components/build/PreviewBrand";
import { warrantyLabel } from "@/lib/catalog/warranty";
export function ComponentCard({
  component,
  selected,
  owned,
  onSelect,
  showBrand = true,
}: {
  component: CatalogComponent;
  selected?: boolean;
  owned?: boolean;
  onSelect?: () => void;
  showBrand?: boolean;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.article
      className={`component-card ${selected ? "component-card--selected" : ""}`}
      whileHover={reduced ? undefined : { y: -2, scale: 1.015 }}
      transition={{ duration: reduced ? 0 : 0.2 }}
    >
      {selected && (
        <span className="card-selected">
          <span aria-hidden="true">✓</span> En tu equipo
        </span>
      )}
      <ProductZoom component={component} />
      <div className="component-card__body">
        {showBrand && (
          <div className="component-card__brand">
            <PreviewBrand component={component} />
          </div>
        )}
        <p className="eyebrow">
          {component.brand} / {CATEGORIES.find((c) => c.key === component.category)?.label}
        </p>
        <h3>
          <Link href={`/catalog/${component.category}/${component.slug}`}>{component.name}</Link>
        </h3>
        <div className="spec-pills">
          {component.specs.slice(0, 3).map((s) => (
            <span key={s.label} title={s.label}>
              <small>{s.label}</small>
              {s.value}
            </span>
          ))}
        </div>
        <p className="card-warranty">
          Garantía comercial <span>{warrantyLabel(component.warrantyMonths)}</span>
        </p>
        <div className="component-card__quote">
          <p className="component-card__price">
            {owned
              ? "Ya lo tenés"
              : component.priceBob === null
                ? "Precio por cotizar"
                : component.priceMaxBob && component.priceMaxBob > component.priceBob
                  ? formatBob(component.priceBob) + " – " + formatBob(component.priceMaxBob)
                  : formatBob(component.priceBob)}
          </p>
          {component.priceSource && !owned && (
            <p className="small muted">
              <a href={component.priceSource.url} target="_blank" rel="noreferrer">
                {component.priceSource.store} ↗
              </a>{" "}
              · {component.priceSource.observedAt.slice(0, 10)}
            </p>
          )}
          {component.priceBob === null && !owned && (
            <p className="muted small">Sin cotización verificada.</p>
          )}
        </div>
        {onSelect ? (
          <button
            className={`button ${selected ? "button--ghost" : ""}`}
            type="button"
            onClick={onSelect}
            aria-pressed={selected}
          >
            {selected ? "Quitar del build" : owned ? "Usar mi componente" : "Añadir al build"}
            <span aria-hidden="true">{selected ? "−" : "+"}</span>
          </button>
        ) : (
          <Link className="text-link" href={`/catalog/${component.category}/${component.slug}`}>
            Ver componente <span aria-hidden="true">↗</span>
          </Link>
        )}
      </div>
    </motion.article>
  );
}
