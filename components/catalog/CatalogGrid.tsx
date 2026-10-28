"use client";
import { useState } from "react";
import type { CatalogComponent } from "@/lib/catalog/types";
import { CATEGORIES } from "@/lib/catalog/types";
import { ComponentCard } from "./ComponentCard";
import { Reveal } from "@/components/motion/Reveal";
import { HardwareIcon } from "@/components/icons";
export function CatalogGrid({ components }: { components: CatalogComponent[] }) {
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [search, setSearch] = useState("");
  const [max, setMax] = useState("");
  const brands = [...new Set(components.map((c) => c.brand))].sort();
  const filtered = components.filter(
    (c) =>
      (!category || c.category === category) &&
      (!brand || c.brand === brand) &&
      c.name.toLocaleLowerCase("es").includes(search.toLocaleLowerCase("es")) &&
      (!max || (c.priceBob !== null && c.priceBob <= Number(max))),
  );
  return (
    <>
      <nav className="catalog-categories" aria-label="Explorar por categoría">
        <button type="button" aria-pressed={!category} onClick={() => setCategory("")}>
          Todas las piezas <span>{components.length}</span>
        </button>
        {CATEGORIES.map((c) => (
          <button
            type="button"
            key={c.key}
            aria-pressed={category === c.key}
            onClick={() => setCategory(c.key)}
          >
            <HardwareIcon kind={c.key} />
            {c.label}
          </button>
        ))}
      </nav>
      <form
        className="catalog-filters"
        onSubmit={(e) => e.preventDefault()}
        aria-label="Filtros del catálogo"
      >
        <label>
          Buscar
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Marca o modelo"
          />
        </label>
        <label>
          Categoría
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Todas</option>
            {CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Marca
          <select value={brand} onChange={(e) => setBrand(e.target.value)}>
            <option value="">Todas</option>
            {brands.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </label>
        <label>
          Hasta Bs.
          <input
            type="number"
            min="0"
            step="100"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            placeholder="Sin límite"
          />
        </label>
        <button
          className="button button--ghost"
          type="button"
          onClick={() => {
            setCategory("");
            setBrand("");
            setSearch("");
            setMax("");
          }}
        >
          Limpiar
        </button>
      </form>
      <div className="catalog-results">
        <p className="muted small" role="status">
          {filtered.length} de {components.length} componentes
        </p>
        <p className="muted small">
          {max
            ? "El filtro de precio excluye piezas sin cotización."
            : "Fichas técnicas · Precios en Bs."}
        </p>
      </div>
      <div className="catalog-grid">
        {filtered.map((c, index) => (
          <Reveal key={c.id} index={index} className="catalog-card-reveal">
            <ComponentCard component={c} />
          </Reveal>
        ))}
      </div>
      {!filtered.length && (
        <div className="empty-state">
          <HardwareIcon kind="cpu" />
          <h2>No encontramos esa combinación.</h2>
          <p>Probá otra categoría o quitá el límite de precio.</p>
          <button
            className="button button--ghost"
            type="button"
            onClick={() => {
              setCategory("");
              setBrand("");
              setSearch("");
              setMax("");
            }}
          >
            Ver todas las piezas
          </button>
        </div>
      )}
    </>
  );
}
