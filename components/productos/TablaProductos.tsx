"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type Row,
  type VisibilityState,
  type RowSelectionState,
} from "@tanstack/react-table";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DropdownMenu, Dialog } from "radix-ui";
import {
  Plus,
  Search,
  SlidersHorizontal,
  MoreHorizontal,
  GripVertical,
  ImageOff,
  CheckCircle2,
  Laptop,
  Zap,
  TriangleAlert,
  EyeOff,
  X,
  ChevronDown,
  ScanLine,
  FileSpreadsheet,
  Package,
} from "lucide-react";
import { useBranch } from "@/components/admin/AppShell";
import { hasRole, type UserRole } from "@/lib/auth-permissions";
import type { ProductListItem, ProductListResult } from "@/lib/productos/listar";
import { searchPriceCents } from "@/lib/productos/query";
import { CategoriasRapidas } from "./CategoriasRapidas";
type Category = { id: string; nombre: string; padreId: string | null; total: number };
const labels: Record<string, string> = {
  EN_STOCK: "Disponible",
  SIN_STOCK: "Agotado",
  BAJO_PEDIDO: "Bajo pedido",
  STOCK_BAJO: "Stock bajo",
};
const money = (value: number | null, usd = false) =>
  value === null
    ? "—"
    : `${usd ? "$us " : "Bs"}${new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value / 100)}`;
const iconSet = {
  completo: CheckCircle2,
  computo: Laptop,
  oferta: Zap,
  revision: TriangleAlert,
  escondido: EyeOff,
};
function watchMobile(notify: () => void) {
  const media = window.matchMedia("(max-width:767px)");
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
}
const isMobile = () => window.matchMedia("(max-width:767px)").matches;
async function call(url: string, method: string, body?: unknown) {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "No se pudo completar la acción");
  return data;
}
function SortableRow({
  row,
  manual,
  onOpen,
}: {
  row: Row<ProductListItem>;
  manual: boolean;
  onOpen: () => void;
}) {
  const { setNodeRef, setActivatorNodeRef, transform, transition, attributes, listeners } =
    useSortable({
      id: row.id,
      disabled: !manual,
    });
  return (
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      tabIndex={0}
      onClick={(event) => {
        if (!(event.target as HTMLElement).closest("button,input,a,select,form")) onOpen();
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" && event.target === event.currentTarget) onOpen();
      }}
      className={row.getIsSelected() ? "is-selected" : ""}
    >
      {row.getVisibleCells().map((cell) => (
        <td key={cell.id}>
          {cell.column.id === "drag" ? (
            <button
              ref={setActivatorNodeRef}
              disabled={!manual}
              type="button"
              className="elite-drag"
              aria-label={`Reordenar ${row.original.sku}`}
              {...attributes}
              {...listeners}
            >
              <GripVertical size={17} />
            </button>
          ) : (
            flexRender(cell.column.columnDef.cell, cell.getContext())
          )}
        </td>
      ))}
    </tr>
  );
}
function QuickPrice({
  item,
  enabled,
  onSave,
}: {
  item: ProductListItem;
  enabled: boolean;
  onSave: (body: unknown) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  if (editing)
    return (
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          const amount = searchPriceCents(value);
          if (!amount) return;
          setSaving(true);
          try {
            if (await onSave({ precioSinFactura: amount })) setEditing(false);
          } finally {
            setSaving(false);
          }
        }}
      >
        <input
          aria-label={`Precio S/F de ${item.sku}`}
          autoFocus
          inputMode="decimal"
          value={value}
          disabled={saving}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            event.stopPropagation();
            if (event.key === "Escape") setEditing(false);
          }}
          onBlur={() => {
            if (!saving) setEditing(false);
          }}
        />
      </form>
    );
  return (
    <button
      type="button"
      className="elite-price"
      title={enabled ? "Doble clic o Enter para editar. Enter guarda y Escape cancela." : undefined}
      onKeyDown={(event) => {
        if (enabled && event.key === "Enter") {
          event.preventDefault();
          setValue(((item.precioSinFactura || 0) / 100).toString());
          setEditing(true);
        }
      }}
      onDoubleClick={() => {
        if (enabled) {
          setValue(((item.precioSinFactura || 0) / 100).toString());
          setEditing(true);
        }
      }}
    >
      {item.precioOferta ? (
        <>
          <strong>{money(item.precioOferta)}</strong>
          <del>{money(item.precioSinFactura)}</del>
        </>
      ) : (
        money(item.precioSinFactura)
      )}
    </button>
  );
}
export function TablaProductos({
  categories,
  brands,
  role,
  initialColumns,
}: {
  categories: Category[];
  brands: { id: string; nombre: string }[];
  role: UserRole;
  initialColumns: VisibilityState;
}) {
  const router = useRouter();
  const mobile = useSyncExternalStore(watchMobile, isMobile, () => false);
  const searchParams = useSearchParams();
  const client = useQueryClient();
  const branch = useBranch();
  const [selection, setSelection] = useState<RowSelectionState>({});
  const [visibility, setVisibility] = useState<VisibilityState>(initialColumns);
  const [categoryBar, setCategoryBar] = useState(false);
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(null);
  const [pending, setPending] = useState(false);
  const [confirm, setConfirm] = useState<{ text: string; run: () => Promise<void> } | null>(null);
  const [bulkAction, setBulkAction] = useState("");
  const [bulkValue, setBulkValue] = useState("");
  const [bulkMode, setBulkMode] = useState("porcentaje");
  const [scrollTop, setScrollTop] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPress = useRef(false);
  const editor = hasRole(role, "EDITOR");
  const vendor = hasRole(role, "VENDEDOR");
  const params = new URLSearchParams(searchParams.toString());
  params.set("sucursal", branch);
  const query = params.toString();
  const page = Number(searchParams.get("page") || 1);
  const size = Number(searchParams.get("pageSize") || 50);
  const order = searchParams.get("orden") || "manual";
  const result = useQuery({
    queryKey: ["productos", query],
    queryFn: async ({ signal }) => {
      const response = await fetch(`/api/productos?${query}`, { signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "No se pudo cargar el listado");
      return data as ProductListResult;
    },
  });
  const items = result.data?.items || [];
  const total = result.data?.total || 0;
  function update(changes: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    if (!("page" in changes)) next.delete("page");
    router.replace(`/admin/productos?${next.toString()}`, { scroll: false });
    setSelection({});
  }
  function notify(text: string, error = false) {
    setNotice({ text, error });
  }
  useEffect(() => {
    if (notice && !notice.error) {
      const timeout = setTimeout(() => setNotice(null), 4000);
      return () => clearTimeout(timeout);
    }
  }, [notice]);
  useEffect(() => {
    if (searchRef.current) searchRef.current.value = searchParams.get("q") || "";
  }, [searchParams]);
  useEffect(() => {
    function key(event: KeyboardEvent) {
      if (
        (event.target as HTMLElement).closest("input,textarea,select,[contenteditable=true]") ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      )
        return;
      if (event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key.toLowerCase() === "n" && editor) {
        event.preventDefault();
        router.push("/admin/productos/nuevo");
      }
    }
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("keydown", key);
      if (timer.current) clearTimeout(timer.current);
      if (pressTimer.current) clearTimeout(pressTimer.current);
    };
  }, [router, editor]);
  async function mutate(url: string, method: string, body?: unknown) {
    setPending(true);
    try {
      await call(url, method, body);
      await client.invalidateQueries({ queryKey: ["productos"] });
      await client.invalidateQueries({ queryKey: ["busqueda-global"] });
      notify("Cambios guardados");
      return true;
    } catch (error) {
      notify(error instanceof Error ? error.message : "No se pudo guardar", true);
      return false;
    } finally {
      setPending(false);
    }
  }
  async function patch(item: ProductListItem, body: unknown) {
    return mutate(`/api/productos/${item.id}`, "PATCH", {
      ...(body as object),
      updatedAt: new Date(item.updatedAt).toISOString(),
    });
  }
  function availability(item: ProductListItem) {
    const label =
      item.tipo === "IMAGEN" ? "—" : item.stockBajo ? "Stock bajo" : labels[item.disponibilidad];
    return (
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            disabled={!vendor || item.tipo === "IMAGEN" || pending}
            className={`elite-availability ${item.stockBajo ? "STOCK_BAJO" : item.disponibilidad}`}
          >
            {label}
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content className="elite-dropdown">
            {["EN_STOCK", "SIN_STOCK", "BAJO_PEDIDO"].map((value) => (
              <DropdownMenu.Item
                key={value}
                onSelect={() => void patch(item, { disponibilidad: value })}
              >
                {labels[value]}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    );
  }
  function open(item: ProductListItem) {
    router.push(
      `/admin/productos/${item.id}?volver=${encodeURIComponent(`/admin/productos?${searchParams}`)}`,
    );
  }
  function actions(item: ProductListItem) {
    return (
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            className="elite-icon-button"
            aria-label={`Acciones de ${item.sku}`}
          >
            <MoreHorizontal size={18} />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content className="elite-dropdown" align="end">
            <DropdownMenu.Item onSelect={() => open(item)}>
              {editor ? "Editar" : "Ver producto"}
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild>
              <Link href={`/admin/productos/${item.id}/historial`}>Ver historial</Link>
            </DropdownMenu.Item>
            {editor && (
              <DropdownMenu.Item
                onSelect={() => void mutate(`/api/productos/${item.id}/duplicar`, "POST")}
              >
                Duplicar
              </DropdownMenu.Item>
            )}
            {editor && (
              <DropdownMenu.Item onSelect={() => void patch(item, { escondido: !item.escondido })}>
                {item.escondido ? "Mostrar" : "Esconder"}
              </DropdownMenu.Item>
            )}
            {role === "ADMIN" && (
              <DropdownMenu.Item
                onSelect={() =>
                  setConfirm({
                    text: `¿Eliminar ${item.sku}? Podrás restaurarlo durante 30 días.`,
                    run: async () => {
                      await mutate(`/api/productos/${item.id}`, "DELETE");
                    },
                  })
                }
              >
                Eliminar
              </DropdownMenu.Item>
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    );
  }
  const columns: ColumnDef<ProductListItem>[] = [
    { id: "drag", header: "", enableHiding: false },
    {
      id: "seleccion",
      header: ({ table }) => (
        <input
          type="checkbox"
          aria-label="Seleccionar página visible"
          checked={table.getIsAllRowsSelected()}
          ref={(element) => {
            if (element) element.indeterminate = table.getIsSomeRowsSelected();
          }}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          aria-label={`Seleccionar ${row.original.sku}`}
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
      enableHiding: false,
    },
    {
      id: "imagen",
      header: "Imagen",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <span
            className={`elite-thumbnail ${item.disponibilidad === "SIN_STOCK" ? "is-out" : ""}`}
          >
            {item.imagen ? (
              <Image
                unoptimized
                src={item.imagen.miniatura}
                alt={item.imagen.alt || ""}
                width={32}
                height={32}
              />
            ) : (
              <ImageOff size={20} />
            )}
            <small>{item.stockTotal === 99999 ? "∞" : item.stockTotal}</small>
          </span>
        );
      },
    },
    {
      accessorKey: "titulo",
      header: "Título",
      cell: ({ row }) => (
        <span className="elite-product-title">
          <small>{row.original.sku}</small>
          {row.original.titulo}
          <span className="elite-state-icons">
            {row.original.iconos.map((key) => {
              const Icon = iconSet[key as keyof typeof iconSet];
              return Icon ? (
                <Icon
                  key={key}
                  size={14}
                  aria-label={
                    {
                      completo: "Ficha completa",
                      computo: "Cómputo",
                      oferta: "Oferta o destacado",
                      revision: "Revisar",
                      escondido: "Escondido",
                    }[key]
                  }
                />
              ) : null;
            })}
          </span>
        </span>
      ),
      enableHiding: false,
    },
    { accessorKey: "categoria", header: "Categoría" },
    { accessorKey: "subcategoria", header: "Subcategoría" },
    {
      id: "etiquetas",
      header: "Etiquetas",
      cell: ({ row }) => (
        <span className="elite-tags">
          {row.original.etiquetas.slice(0, 3).map((tag) => (
            <span key={tag.id}>{tag.nombre}</span>
          ))}
          {row.original.etiquetas.length > 3 && (
            <span
              title={row.original.etiquetas
                .slice(3)
                .map((v) => v.nombre)
                .join(", ")}
            >
              +{row.original.etiquetas.length - 3}
            </span>
          )}
        </span>
      ),
    },
    {
      accessorKey: "precioSinFactura",
      header: "Precio S/F",
      cell: ({ row }) => (
        <QuickPrice
          item={row.original}
          enabled={editor}
          onSave={(body) => patch(row.original, body)}
        />
      ),
    },
    {
      accessorKey: "precioConFactura",
      header: "Precio C/F",
      cell: ({ row }) => money(row.original.precioConFactura),
    },
    {
      accessorKey: "precioUsd",
      header: "USD",
      cell: ({ row }) => (
        <span
          title={
            row.original.usdCalculado
              ? `Calculado con TC ${row.original.tipoCambioUsado}`
              : undefined
          }
        >
          {money(row.original.precioUsd, true)}
        </span>
      ),
    },
    {
      accessorKey: "tipo",
      header: "Tipo",
      cell: ({ row }) => (row.original.tipo === "CARRITO" ? "Carrito" : "Imagen"),
    },
    {
      accessorKey: "disponibilidad",
      header: "Disponibilidad",
      cell: ({ row }) => availability(row.original),
    },
    { id: "acciones", header: "", cell: ({ row }) => actions(row.original), enableHiding: false },
  ];
  // TanStack mantiene funciones internas; este componente se renderiza sin memoización del compilador.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (item) => item.id,
    state: {
      rowSelection: selection,
      columnVisibility: {
        ...visibility,
        drag: order === "manual" && searchParams.get("dir") !== "desc" && editor,
      },
    },
    onRowSelectionChange: setSelection,
    onColumnVisibilityChange: setVisibility,
    enableRowSelection: true,
  });
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const activeFilters = [...searchParams.entries()].filter(
    ([key]) => !["page", "pageSize", "orden", "dir"].includes(key),
  );
  const selected = Object.keys(selection).filter(
    (id) => selection[id] && items.some((item) => item.id === id),
  );
  const allRows = table.getRowModel().rows;
  const virtual = size === 2000 && total > 2000;
  const start = virtual ? Math.max(0, Math.floor(scrollTop / (mobile ? 154 : 64)) - 8) : 0;
  const end = virtual ? Math.min(allRows.length, start + 32) : allRows.length;
  const rows = allRows.slice(start, end);
  async function applyBulk() {
    const action = bulkAction;
    let datos: unknown;
    if (action === "categoria") datos = { categoriaId: bulkValue };
    if (["agregarEtiquetas", "quitarEtiquetas"].includes(action))
      datos = {
        etiquetas: bulkValue
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
      };
    if (action === "ajustarPrecio") {
      const fixed = searchPriceCents(bulkValue.trim().replace(/^[+-]/, ""));
      const valor =
        bulkMode === "monto"
          ? fixed === null
            ? null
            : fixed * (bulkValue.trim().startsWith("-") ? -1 : 1)
          : Number(bulkValue.replace(",", "."));
      if (valor === null || !Number.isFinite(valor)) {
        notify("Ingresa un ajuste válido", true);
        return;
      }
      datos = { tipo: bulkMode, valor, redondear: true };
    }
    const run = async () => {
      if (
        await mutate("/api/productos/bulk", "POST", {
          ids: selected,
          accion: action,
          ...(datos ? { datos } : {}),
        })
      ) {
        setSelection({});
        setBulkAction("");
      }
    };
    if (["archivar", "eliminar"].includes(action))
      setConfirm({
        text: `¿${action === "eliminar" ? "Eliminar" : "Archivar"} ${selected.length} productos?`,
        run,
      });
    else await run();
  }
  return (
    <>
      <div className="elite-page-header">
        <div>
          <h1>Productos</h1>
          <p>Organiza tu catálogo y revisa precios y disponibilidad.</p>
        </div>
        {editor && (
          <div className="elite-toolbar">
            <Link href="/admin/batch-ia?entrada=imagen" className="elite-button secondary">
              <ScanLine size={16} />
              Escanear menú
            </Link>
            <Link href="/admin/batch-ia?entrada=archivo" className="elite-button secondary">
              <FileSpreadsheet size={16} />
              Importar Excel/CSV
            </Link>
            <Link href="/admin/productos/nuevo" className="elite-button">
              <Plus size={16} />
              Crear nuevo
            </Link>
            <a
              className="elite-button secondary"
              href={`/api/productos/export?${query}&columnas=${encodeURIComponent(["sku", ...table.getVisibleLeafColumns().map((v) => v.id)].join(","))}${selected.length ? `&ids=${selected.join(",")}` : ""}`}
            >
              Exportar Excel
            </a>
          </div>
        )}
      </div>
      {notice && (
        <div
          className={`elite-notice ${notice.error ? "is-error" : ""}`}
          role={notice.error ? "alert" : "status"}
        >
          {notice.text}
          <button type="button" aria-label="Cerrar aviso" onClick={() => setNotice(null)}>
            <X size={16} />
          </button>
        </div>
      )}
      <section className="elite-card elite-catalog">
        <div className="elite-toolbar">
          <select
            aria-label="Acciones masivas"
            value={bulkAction}
            disabled={!editor || !selected.length || pending}
            onChange={(event) => {
              setBulkAction(event.target.value);
              setBulkValue("");
            }}
          >
            <option value="">Acciones ({selected.length})</option>
            {Object.entries({
              disponible: "Marcar disponible",
              agotado: "Marcar agotado",
              categoria: "Cambiar categoría",
              agregarEtiquetas: "Agregar etiquetas",
              quitarEtiquetas: "Quitar etiquetas",
              ajustarPrecio: "Ajustar precio",
              esconder: "Esconder",
              mostrar: "Mostrar",
              duplicar: "Duplicar",
              archivar: "Archivar",
              ...(role === "ADMIN" ? { eliminar: "Eliminar" } : {}),
            }).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </select>
          <label className="elite-list-search">
            <Search size={17} />
            <span className="sr-only">Buscar productos</span>
            <input
              ref={searchRef}
              defaultValue={searchParams.get("q") || ""}
              placeholder="Buscar por título, categoría o precio"
              onChange={(event) => {
                if (timer.current) clearTimeout(timer.current);
                const value = event.target.value;
                timer.current = setTimeout(() => update({ q: value || null }), 300);
              }}
            />
          </label>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="elite-button secondary">
                <SlidersHorizontal size={15} />
                Columnas
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content className="elite-dropdown">
                {table
                  .getAllLeafColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenu.CheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => {
                        const next = { ...visibility, [column.id]: !!value };
                        setVisibility(next);
                        void call("/api/admin/preferencias", "PATCH", { columnas: next }).catch(
                          () => notify("No se pudo guardar la preferencia de columnas", true),
                        );
                      }}
                      onSelect={(event) => event.preventDefault()}
                    >
                      {column.getIsVisible() ? "✓ " : ""}
                      {String(column.columnDef.header)}
                    </DropdownMenu.CheckboxItem>
                  ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
        {bulkAction && (
          <div className="elite-bulk-editor">
            <strong>{selected.length} seleccionados</strong>
            {bulkAction === "categoria" ? (
              <select
                aria-label="Nueva categoría"
                value={bulkValue}
                onChange={(event) => setBulkValue(event.target.value)}
              >
                <option value="">Elige una categoría</option>
                {categories
                  .filter((c) => !c.padreId)
                  .map((c) => (
                    <option value={c.id} key={c.id}>
                      {c.nombre}
                    </option>
                  ))}
              </select>
            ) : ["agregarEtiquetas", "quitarEtiquetas", "ajustarPrecio"].includes(bulkAction) ? (
              <>
                <input
                  aria-label="Valor de acción masiva"
                  placeholder={
                    bulkAction === "ajustarPrecio" ? "Ajuste" : "Etiquetas separadas por comas"
                  }
                  value={bulkValue}
                  onChange={(event) => setBulkValue(event.target.value)}
                />
                {bulkAction === "ajustarPrecio" && (
                  <select
                    aria-label="Tipo de ajuste"
                    value={bulkMode}
                    onChange={(event) => setBulkMode(event.target.value)}
                  >
                    <option value="porcentaje">Porcentaje</option>
                    <option value="monto">Monto en Bs</option>
                  </select>
                )}
              </>
            ) : null}
            <button
              className="elite-button"
              disabled={pending || !selected.length}
              onClick={() => void applyBulk()}
            >
              Aplicar
            </button>
            <button className="elite-button secondary" onClick={() => setBulkAction("")}>
              Cancelar
            </button>
          </div>
        )}
        <button
          type="button"
          className="elite-category-toggle"
          onClick={() => setCategoryBar(!categoryBar)}
          aria-expanded={categoryBar}
        >
          <ChevronDown size={16} />
          Administrar Categorías <span>{categories.filter((c) => !c.padreId).length}</span>
        </button>
        {categoryBar && (
          <div className="elite-category-chips">
            {categories
              .filter((c) => !c.padreId)
              .map((c) => (
                <button
                  key={c.id}
                  className="elite-badge"
                  onClick={() => update({ categoria: c.id, subcategoria: null })}
                >
                  {c.nombre} ({c.total})
                </button>
              ))}
            {editor && <CategoriasRapidas categories={categories} />}
          </div>
        )}
        <div className="elite-filters">
          {[
            {
              key: "categoria",
              label: "Categoría",
              options: categories.filter((c) => !c.padreId).map((c) => [c.id, c.nombre]),
            },
            {
              key: "subcategoria",
              label: "Subcategoría",
              options: categories
                .filter((c) => c.padreId === searchParams.get("categoria"))
                .map((c) => [c.id, c.nombre]),
            },
            { key: "marca", label: "Marca", options: brands.map((b) => [b.id, b.nombre]) },
            { key: "disponibilidad", label: "Disponibilidad", options: Object.entries(labels) },
            {
              key: "tipo",
              label: "Tipo",
              options: [
                ["CARRITO", "Carrito"],
                ["IMAGEN", "Imagen"],
              ],
            },
            {
              key: "escondido",
              label: "Visibilidad",
              options: [
                ["false", "Visible"],
                ["true", "Escondido"],
              ],
            },
          ].map((filter) => (
            <select
              key={filter.key}
              aria-label={filter.label}
              value={searchParams.get(filter.key) || ""}
              onChange={(event) =>
                update({
                  [filter.key]: event.target.value || null,
                  ...(filter.key === "categoria" ? { subcategoria: null } : {}),
                })
              }
            >
              <option value="">{filter.label}</option>
              {filter.options.map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          ))}
          <input
            key={`min-${searchParams.get("precioMin")}`}
            aria-label="Precio mínimo en Bs"
            placeholder="Bs mín."
            inputMode="decimal"
            defaultValue={searchParams.get("precioMin") || ""}
            onBlur={(event) => update({ precioMin: event.target.value || null })}
          />
          <input
            key={`max-${searchParams.get("precioMax")}`}
            aria-label="Precio máximo en Bs"
            placeholder="Bs máx."
            inputMode="decimal"
            defaultValue={searchParams.get("precioMax") || ""}
            onBlur={(event) => update({ precioMax: event.target.value || null })}
          />
          {["revision", "sinImagen"].map((key) => (
            <label key={key}>
              <input
                type="checkbox"
                checked={searchParams.get(key) === "true"}
                onChange={(event) => update({ [key]: event.target.checked ? "true" : null })}
              />
              {key === "revision" ? "Requiere revisión" : "Sin imagen"}
            </label>
          ))}
        </div>
        {activeFilters.length > 0 && (
          <div className="elite-filter-chips">
            {activeFilters.map(([key, value]) => (
              <button
                key={key}
                className="elite-badge"
                onClick={() =>
                  update({ [key]: null, ...(key === "categoria" ? { subcategoria: null } : {}) })
                }
              >
                {{
                  q: "Búsqueda",
                  categoria: "Categoría",
                  subcategoria: "Subcategoría",
                  marca: "Marca",
                  etiqueta: "Etiqueta",
                  disponibilidad: "Disponibilidad",
                  tipo: "Tipo",
                  escondido: "Visibilidad",
                  revision: "Requiere revisión",
                  sinImagen: "Sin imagen",
                  precioMin: "Precio mínimo",
                  precioMax: "Precio máximo",
                  sucursal: "Sucursal",
                }[key] || key}
                :{" "}
                {categories.find((c) => c.id === value)?.nombre ||
                  brands.find((b) => b.id === value)?.nombre ||
                  labels[value] ||
                  value}
                <X size={12} />
              </button>
            ))}
            <Link href="/admin/productos">Limpiar filtros</Link>
          </div>
        )}
        <div className="elite-list-order">
          <label>
            Orden{" "}
            <select value={order} onChange={(event) => update({ orden: event.target.value })}>
              <option value="manual">Manual</option>
              {[
                "titulo",
                "categoria",
                "precioSinFactura",
                "precioConFactura",
                "precioUsd",
                "tipo",
                "disponibilidad",
                "createdAt",
              ].map((value) => (
                <option key={value} value={value}>
                  {
                    {
                      titulo: "Título",
                      categoria: "Categoría",
                      precioSinFactura: "Precio S/F",
                      precioConFactura: "Precio C/F",
                      precioUsd: "USD",
                      tipo: "Tipo",
                      disponibilidad: "Disponibilidad",
                      createdAt: "Fecha de creación",
                    }[value]
                  }
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={() => update({ dir: searchParams.get("dir") === "desc" ? "asc" : "desc" })}
          >
            {searchParams.get("dir") === "desc" ? "Descendente" : "Ascendente"}
          </button>
        </div>
        {result.isPending ? (
          <div className="elite-table-loading" aria-label="Cargando productos" aria-busy="true">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="elite-skeleton" style={{ height: 42 }} />
            ))}
          </div>
        ) : result.isError ? (
          <div className="elite-empty" role="alert">
            <p>{result.error.message}</p>
            <button className="elite-button" onClick={() => void result.refetch()}>
              Reintentar
            </button>
          </div>
        ) : !items.length ? (
          <div className="elite-empty">
            <Package size={36} />
            <h2>
              {activeFilters.length
                ? "No encontramos productos para tu búsqueda"
                : "Todavía no cargaste productos"}
            </h2>
            {activeFilters.length ? (
              <Link href="/admin/productos">Limpiar filtros</Link>
            ) : (
              editor && (
                <div className="elite-toolbar">
                  <Link className="elite-button" href="/admin/productos/nuevo">
                    Crear con IA
                  </Link>
                  <Link className="elite-button secondary" href="/admin/batch-ia?entrada=archivo">
                    Importar Excel
                  </Link>
                </div>
              )
            )}
          </div>
        ) : (
          <>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(event) => {
                if (
                  !editor ||
                  order !== "manual" ||
                  searchParams.get("dir") === "desc" ||
                  event.active.id === event.over?.id ||
                  !event.over
                )
                  return;
                const old = items.findIndex((v) => v.id === event.active.id),
                  next = items.findIndex((v) => v.id === event.over!.id);
                const moved = arrayMove(items, old, next);
                void mutate("/api/productos/reorder", "PATCH", {
                  id: event.active.id,
                  despuesDe: moved[next - 1]?.id || null,
                  antesDe: moved[next + 1]?.id || null,
                });
              }}
            >
              <div
                className="elite-table-scroll"
                style={virtual ? { maxHeight: 720, overflow: "auto" } : undefined}
                onScroll={(event) => {
                  if (virtual) setScrollTop(event.currentTarget.scrollTop);
                }}
              >
                <table className="elite-products-table">
                  <thead>
                    {table.getHeaderGroups().map((group) => (
                      <tr key={group.id}>
                        {group.headers.map((header) => (
                          <th
                            key={header.id}
                            aria-sort={
                              order === header.column.id
                                ? searchParams.get("dir") === "desc"
                                  ? "descending"
                                  : "ascending"
                                : undefined
                            }
                          >
                            {[
                              "titulo",
                              "categoria",
                              "subcategoria",
                              "precioSinFactura",
                              "precioConFactura",
                              "precioUsd",
                              "tipo",
                              "disponibilidad",
                            ].includes(header.column.id) ? (
                              <button
                                type="button"
                                onClick={() =>
                                  update({
                                    orden: header.column.id,
                                    dir:
                                      order === header.column.id &&
                                      searchParams.get("dir") !== "desc"
                                        ? "desc"
                                        : "asc",
                                  })
                                }
                              >
                                {flexRender(header.column.columnDef.header, header.getContext())}
                              </button>
                            ) : (
                              flexRender(header.column.columnDef.header, header.getContext())
                            )}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <SortableContext
                    items={items.map((item) => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <tbody>
                      {virtual && start > 0 && (
                        <tr aria-hidden="true">
                          <td
                            colSpan={table.getVisibleLeafColumns().length}
                            style={{ height: start * 64, padding: 0 }}
                          />
                        </tr>
                      )}
                      {rows.map((row) => (
                        <SortableRow
                          key={row.id}
                          row={row}
                          manual={
                            editor &&
                            order === "manual" &&
                            searchParams.get("dir") !== "desc" &&
                            !pending
                          }
                          onOpen={() => open(row.original)}
                        />
                      ))}
                      {virtual && end < allRows.length && (
                        <tr aria-hidden="true">
                          <td
                            colSpan={table.getVisibleLeafColumns().length}
                            style={{ height: (allRows.length - end) * 64, padding: 0 }}
                          />
                        </tr>
                      )}
                    </tbody>
                  </SortableContext>
                </table>
              </div>
            </DndContext>
            <div
              className="elite-mobile-products"
              style={virtual ? { maxHeight: 720, overflow: "auto" } : undefined}
              onScroll={(event) => {
                if (virtual) setScrollTop(event.currentTarget.scrollTop);
              }}
            >
              {virtual && start > 0 && <div aria-hidden="true" style={{ height: start * 154 }} />}
              {(virtual ? items.slice(start, end) : items).map((item) => (
                <article
                  key={item.id}
                  className={`${selection[item.id] ? "is-selected" : ""} ${virtual ? "is-virtual" : ""}`}
                  onPointerDown={() => {
                    longPress.current = false;
                    pressTimer.current = setTimeout(() => {
                      longPress.current = true;
                      setSelection((v) => ({ ...v, [item.id]: !v[item.id] }));
                    }, 550);
                  }}
                  onPointerUp={() => {
                    if (pressTimer.current) clearTimeout(pressTimer.current);
                  }}
                  onPointerCancel={() => {
                    if (pressTimer.current) clearTimeout(pressTimer.current);
                  }}
                  onPointerMove={() => {
                    if (pressTimer.current) clearTimeout(pressTimer.current);
                  }}
                  onClickCapture={(event) => {
                    if (longPress.current) {
                      event.preventDefault();
                      event.stopPropagation();
                      longPress.current = false;
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    aria-label={`Seleccionar ${item.sku} en móvil`}
                    checked={!!selection[item.id]}
                    onChange={(event) =>
                      setSelection((v) => ({ ...v, [item.id]: event.target.checked }))
                    }
                  />
                  {item.imagen ? (
                    <Image
                      unoptimized
                      src={item.imagen.miniatura}
                      width={52}
                      height={52}
                      alt={item.imagen.alt || ""}
                    />
                  ) : (
                    <ImageOff size={32} />
                  )}
                  <div>
                    <button type="button" className="elite-mobile-title" onClick={() => open(item)}>
                      {item.titulo}
                    </button>
                    <small>{item.sku}</small>
                    <strong>
                      {money(item.precioOferta || item.precioSinFactura || item.precioConFactura)}
                    </strong>
                    {availability(item)}
                  </div>
                  {actions(item)}
                </article>
              ))}
              {virtual && end < items.length && (
                <div aria-hidden="true" style={{ height: (items.length - end) * 154 }} />
              )}
            </div>
          </>
        )}
        <div className="elite-table-footer">
          <span>{total.toLocaleString("es-BO")} Productos</span>
          <label>
            Por página{" "}
            <select
              aria-label="Productos por página"
              value={size}
              onChange={(event) => update({ pageSize: event.target.value, page: "1" })}
            >
              {[25, 50, 100, 500, 2000].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <button
            disabled={page <= 1 || result.isFetching}
            onClick={() => update({ page: String(page - 1) })}
          >
            Anterior
          </button>
          <span>
            Página {page} de {Math.max(1, Math.ceil(total / size))}
          </span>
          <button
            disabled={page * size >= total || result.isFetching}
            onClick={() => update({ page: String(page + 1) })}
          >
            Siguiente
          </button>
        </div>
      </section>
      <Dialog.Root
        open={!!confirm}
        onOpenChange={(open) => {
          if (!open && !pending) setConfirm(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="elite-overlay" />
          <Dialog.Content className="elite-search-dialog">
            <Dialog.Title>Confirmar acción</Dialog.Title>
            <Dialog.Description>{confirm?.text}</Dialog.Description>
            <div className="elite-toolbar">
              <Dialog.Close asChild>
                <button className="elite-button secondary" disabled={pending}>
                  Cancelar
                </button>
              </Dialog.Close>
              <button
                className="elite-button"
                disabled={pending}
                onClick={async () => {
                  await confirm?.run();
                  setConfirm(null);
                }}
              >
                Confirmar
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
