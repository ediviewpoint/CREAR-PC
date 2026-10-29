"use client";
import { useState } from "react";
import { Dialog } from "radix-ui";
import { Pencil, ArrowUp, ArrowDown, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
type Category = { id: string; nombre: string; padreId: string | null; total: number };
export function CategoriasRapidas({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [parent, setParent] = useState("");
  const [editing, setEditing] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const client = useQueryClient();
  async function save(url: string, method: string, body: unknown) {
    setPending(true);
    setError("");
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "No se pudo guardar");
      await client.invalidateQueries({ queryKey: ["productos"] });
      router.refresh();
      setName("");
      setEditing("");
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : "No se pudo guardar");
      return false;
    } finally {
      setPending(false);
    }
  }
  const roots = categories.filter((v) => !v.padreId);
  function move(index: number, direction: number) {
    const next = roots.map((v) => v.id);
    const other = index + direction;
    if (other < 0 || other >= next.length) return;
    [next[index], next[other]] = [next[other]!, next[index]!];
    void save("/api/categorias", "PATCH", { ids: next });
  }
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        if (!pending) setOpen(value);
      }}
    >
      <Dialog.Trigger asChild>
        <button type="button" className="elite-button secondary">
          <Pencil size={14} />
          Editar categorías
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="elite-overlay" />
        <Dialog.Content className="elite-search-dialog">
          <Dialog.Title>Administrar categorías</Dialog.Title>
          <Dialog.Description>
            Renombra, ordena o agrega categorías y subcategorías.
          </Dialog.Description>
          <Dialog.Close
            className="elite-icon-button elite-close"
            aria-label="Cerrar categorías"
            disabled={pending}
          >
            <X size={18} />
          </Dialog.Close>
          <ul className="elite-quick-categories">
            {roots.map((category, index) => (
              <li key={category.id}>
                <span>
                  {category.nombre}
                  <small>{category.total} productos</small>
                </span>
                <button
                  disabled={pending || index === 0}
                  className="elite-icon-button"
                  aria-label={`Subir ${category.nombre}`}
                  onClick={() => move(index, -1)}
                >
                  <ArrowUp size={15} />
                </button>
                <button
                  disabled={pending || index === roots.length - 1}
                  className="elite-icon-button"
                  aria-label={`Bajar ${category.nombre}`}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDown size={15} />
                </button>
                <button
                  disabled={pending}
                  className="elite-icon-button"
                  aria-label={`Renombrar ${category.nombre}`}
                  onClick={() => {
                    setEditing(category.id);
                    setName(category.nombre);
                  }}
                >
                  <Pencil size={15} />
                </button>
                {categories
                  .filter((v) => v.padreId === category.id)
                  .map((child) => (
                    <div className="elite-quick-child" key={child.id}>
                      <span>{child.nombre}</span>
                      <button
                        disabled={pending}
                        className="elite-icon-button"
                        aria-label={`Renombrar ${child.nombre}`}
                        onClick={() => {
                          setEditing(child.id);
                          setName(child.nombre);
                        }}
                      >
                        <Pencil size={14} />
                      </button>
                    </div>
                  ))}
              </li>
            ))}
          </ul>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void save(
                editing ? `/api/categorias/${editing}` : "/api/categorias",
                editing ? "PUT" : "POST",
                editing ? { nombre: name } : { nombre: name, padreId: parent || null },
              );
            }}
          >
            <label htmlFor="quick-category-name">
              {editing ? "Renombrar categoría" : "Nueva categoría"}
            </label>
            <input
              id="quick-category-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              minLength={1}
              maxLength={80}
              disabled={pending}
            />
            {!editing && (
              <>
                <label htmlFor="quick-category-parent">Categoría principal</label>
                <select
                  id="quick-category-parent"
                  value={parent}
                  onChange={(event) => setParent(event.target.value)}
                  disabled={pending}
                >
                  <option value="">Crear como categoría principal</option>
                  {roots.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nombre}
                    </option>
                  ))}
                </select>
              </>
            )}
            <div className="elite-toolbar">
              <button className="elite-button" disabled={pending || !name.trim()}>
                {pending ? "Guardando" : "Guardar"}
              </button>
              {editing && (
                <button
                  type="button"
                  className="elite-button secondary"
                  onClick={() => {
                    setEditing("");
                    setName("");
                  }}
                >
                  Cancelar edición
                </button>
              )}
            </div>
          </form>
          {error && <p role="alert">{error}</p>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
