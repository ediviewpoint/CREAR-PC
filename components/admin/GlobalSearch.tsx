"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Dialog } from "radix-ui";
import { useQuery } from "@tanstack/react-query";
import { Search, X, ImageOff } from "lucide-react";
type Result = { id: string; sku: string; titulo: string; imagen: string | null };
export function GlobalSearch({ open, onOpen }: { open: boolean; onOpen: (open: boolean) => void }) {
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setQuery(text), 300);
    return () => clearTimeout(timer);
  }, [text]);
  const result = useQuery({
    queryKey: ["busqueda-global", query],
    enabled: open && query.trim().length > 0,
    queryFn: async ({ signal }) => {
      const response = await fetch(`/api/admin/buscar?q=${encodeURIComponent(query)}`, { signal });
      if (!response.ok) throw new Error("No se pudo buscar");
      return response.json() as Promise<{ items: Result[] }>;
    },
  });
  return (
    <Dialog.Root open={open} onOpenChange={onOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="elite-overlay" />
        <Dialog.Content className="elite-search-dialog">
          <Dialog.Title>Buscar productos</Dialog.Title>
          <Dialog.Description>
            Título, SKU, modelo o precio. Hasta ocho resultados.
          </Dialog.Description>
          <Dialog.Close className="elite-icon-button elite-close" aria-label="Cerrar búsqueda">
            <X />
          </Dialog.Close>
          <label className="elite-command-input">
            <Search size={18} />
            <span className="sr-only">Buscar en todo el catálogo</span>
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Título, SKU, modelo o precio"
              autoComplete="off"
            />
          </label>
          <div className="elite-command-results" aria-live="polite">
            {result.isFetching ? (
              <p>Buscando productos…</p>
            ) : result.isError ? (
              <p>No se pudo buscar. Intenta de nuevo.</p>
            ) : !query.trim() ? (
              <p>Escribe para buscar en el catálogo.</p>
            ) : !result.data?.items.length ? (
              <p>No encontramos productos.</p>
            ) : (
              result.data.items.map((item) => (
                <Link
                  key={item.id}
                  href={`/admin/productos/${item.id}`}
                  onClick={() => onOpen(false)}
                >
                  {item.imagen ? (
                    <Image unoptimized src={item.imagen} alt="" width={40} height={40} />
                  ) : (
                    <ImageOff aria-hidden="true" />
                  )}
                  <span>
                    <small>{item.sku}</small>
                    {item.titulo}
                  </span>
                </Link>
              ))
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
