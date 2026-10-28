"use client";
import { useRef } from "react";
import type { Route } from "next";
import Link from "next/link";
import { ProductVisual } from "./ProductVisual";
import { CATEGORIES } from "@/lib/catalog/types";
import type { CatalogComponent } from "@/lib/catalog/types";
import { PreviewBrand } from "@/components/build/PreviewBrand";
export function ProductZoom({ component }: { component: CatalogComponent }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        className="zoom-trigger"
        type="button"
        aria-label={"Ampliar imagen de " + component.name}
        onClick={() => dialog.current?.showModal()}
      >
        <ProductVisual
          category={component.category}
          name={component.name}
          image={component.image}
          imageAlt={component.imageAlt}
        />
        <span className="zoom-trigger__label">
          Explorar <span aria-hidden="true">↗</span>
        </span>
      </button>
      <dialog
        className="zoom-dialog"
        ref={dialog}
        aria-label={"Imagen ampliada: " + component.name}
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current?.close();
        }}
      >
        <div className="zoom-dialog__header">
          <span className="eyebrow">ELITEPC / Vista de componente</span>
          <button
            className="icon-button"
            type="button"
            aria-label="Cerrar imagen"
            onClick={() => dialog.current?.close()}
          >
            ×
          </button>
        </div>
        <div className="zoom-dialog__stage">
          <ProductVisual
            category={component.category}
            name={component.name}
            image={component.image}
            imageAlt={component.imageAlt}
          />
          <div className="zoom-dialog__info">
            <PreviewBrand component={component} large />
            <p className="eyebrow">
              {component.brand} / {CATEGORIES.find((c) => c.key === component.category)?.label}
            </p>
            <h2>{component.name}</h2>
            <dl className="inspect-specs">
              {component.specs.slice(0, 6).map((s) => (
                <div key={s.label}>
                  <dt>{s.label}</dt>
                  <dd>{s.value}</dd>
                </div>
              ))}
            </dl>
            <p className="small muted">
              {component.image
                ? "Verificá el modelo exacto antes de comprar."
                : "Ilustración de categoría. La forma y escala del producto real pueden variar."}
            </p>
            <Link
              className="button"
              href={("/catalog/" + component.category + "/" + component.slug) as Route}
              onClick={() => dialog.current?.close()}
            >
              Ver ficha técnica ↗
            </Link>
            <span className="small muted">Esc o el botón × para volver.</span>
          </div>
        </div>
      </dialog>
    </>
  );
}
