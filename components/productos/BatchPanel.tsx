"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Dialog } from "radix-ui";
import Papa from "papaparse";
import { Play, Pause, Download } from "lucide-react";
import type { WorkBook } from "xlsx";
import type { BatchItem } from "@/lib/ia/batch";
import { importFields } from "@/lib/importacion";
import { emptyProduct, type ProductInput } from "@/lib/productos/schema";
import { parseAmount } from "@/lib/precios";
import { ImagenesUploader } from "./ImagenesUploader";
type Job = {
  id: string;
  estado: string;
  total: number;
  procesados: number;
  items: BatchItem[];
  opciones: { duplicados?: string };
};
async function request(url: string, body?: unknown) {
  const response = await fetch(
    url,
    body === undefined
      ? {}
      : {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
  );
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message || "No se pudo completar");
  return result;
}
export function BatchPanel({
  categories,
  branches,
  templates,
}: {
  categories: { id: string; nombre: string }[];
  branches: { id: string; nombre: string }[];
  templates: { nombre: string; mapeo: Record<string, string> }[];
}) {
  const search = useSearchParams();
  const router = useRouter();
  const [tab, setTab] = useState(search.get("entrada") || "texto");
  const [text, setText] = useState("");
  const [images, setImages] = useState<ProductInput["imagenes"]>([]);
  const [category, setCategory] = useState("");
  const [currency, setCurrency] = useState("Detectar");
  const [delimiter, setDelimiter] = useState("auto");
  const [separator, setSeparator] = useState("");
  const [generate, setGenerate] = useState(true);
  const [models, setModels] = useState(false);
  const [margin, setMargin] = useState(0);
  const [job, setJob] = useState<Job | null>(null);
  const [busy, setBusy] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [edits, setEdits] = useState<Record<string, Partial<ProductInput>>>({});
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [actions, setActions] = useState<Record<string, string>>({});
  const [duplicates, setDuplicates] = useState<Record<string, string>>({});
  const [specItem, setSpecItem] = useState<string | null>(null);
  const [history, setHistory] = useState<
    {
      id: string;
      createdAt: string;
      total: number;
      procesados: number;
      estado: string;
      tipoEntrada: string;
    }[]
  >([]);
  const [report, setReport] = useState<Record<string, unknown>[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [sheets, setSheets] = useState<string[]>([]);
  const [sheet, setSheet] = useState("");
  const [book, setBook] = useState<WorkBook | null>(null);
  const [importId, setImportId] = useState("");
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [template, setTemplate] = useState("");
  const [useAi, setUseAi] = useState(false);
  const [duplicateMode, setDuplicateMode] = useState("actualizar");
  const [branch, setBranch] = useState("");
  const active = useRef(false);
  const processingId = useRef<string | null>(null);
  useEffect(() => {
    void request("/api/ia/batch")
      .then((data) => setHistory(data.items))
      .catch(() => {});
    const id = search.get("trabajo");
    if (id && processingId.current && processingId.current !== id) active.current = false;
    if (id)
      void request(`/api/ia/batch/${id}`)
        .then(setJob)
        .catch((e) => setError(e.message));
  }, [search]);
  useEffect(
    () => () => {
      active.current = false;
    },
    [],
  );
  async function process(id: string) {
    if (active.current) return;
    processingId.current = id;
    active.current = true;
    setRunning(true);
    try {
      while (active.current) {
        const current = await request(`/api/ia/batch/${id}/siguiente`, {});
        setJob(current);
        if (!current.items.some((v: BatchItem) => ["en_cola", "procesando"].includes(v.estado)))
          break;
        await new Promise((resolve) => setTimeout(resolve, 700));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo procesar");
    } finally {
      active.current = false;
      setRunning(false);
    }
  }
  async function start() {
    setBusy(true);
    setError("");
    try {
      const result = await request("/api/ia/batch", {
        tipoEntrada: tab === "imagen" ? "imagen" : "texto",
        contenido: text,
        imagenes: images.map((v) => v.url),
        opciones: {
          categoriaId: category || undefined,
          moneda: currency,
          buscarModelo: models,
          generarDestacados: generate,
          margen: margin,
          separar: delimiter,
          separador: separator,
        },
      });
      const next = await request(`/api/ia/batch/${result.trabajoId}`);
      setJob(next);
      router.replace(`/admin/batch-ia?trabajo=${result.trabajoId}`, { scroll: false });
      void process(result.trabajoId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo iniciar");
    } finally {
      setBusy(false);
    }
  }
  async function loadFile(file: File) {
    setError("");
    if (file.size > 10 * 1024 * 1024) {
      setError("Máximo 10 MB");
      return;
    }
    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellFormula: false });
      setBook(workbook);
      setSheets(workbook.SheetNames);
      const name = workbook.SheetNames[0]!;
      setSheet(name);
      setRows(XLSX.utils.sheet_to_json(workbook.Sheets[name]!));
      setImportId("");
    } catch {
      setError("No se pudo leer el archivo. Usa Excel o CSV válido");
    }
  }
  async function importPreview() {
    setBusy(true);
    try {
      const result = await request("/api/import", { filas: rows });
      setImportId(result.id);
      setColumns(result.columnas);
      setMapping(result.mapeoSugerido);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo importar");
    } finally {
      setBusy(false);
    }
  }
  async function confirmImport() {
    setBusy(true);
    try {
      const result = await request(`/api/import/${importId}/confirmar`, {
        mapeo: mapping,
        plantilla: template || undefined,
        duplicados: duplicateMode,
        usarIA: useAi,
        categoriaId: category || undefined,
        sucursalId: branch || undefined,
      });
      setJob(await request(`/api/ia/batch/${result.trabajoId}`));
      router.replace(`/admin/batch-ia?trabajo=${result.trabajoId}`, { scroll: false });
      if (useAi) void process(result.trabajoId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo confirmar");
    } finally {
      setBusy(false);
    }
  }
  function edit(id: string, value: Partial<ProductInput>) {
    setEdits((v) => ({ ...v, [id]: { ...v[id], ...value } }));
  }
  async function save(items: BatchItem[], force?: string) {
    if (!job) return;
    setBusy(true);
    setError("");
    try {
      const result = await request(`/api/ia/batch/${job.id}`, {
        items: items.map((item) => ({
          id: item.id,
          producto: { ...item.producto, ...edits[item.id] },
          accion:
            force ||
            actions[item.id] ||
            (item.estado === "duplicado" ? job.opciones.duplicados || "actualizar" : "crear"),
          productoId: duplicates[item.id] || item.duplicados?.[0]?.id,
        })),
      });
      setReport(result.resultados);
      setJob(await request(`/api/ia/batch/${job.id}`));
      setSelected({});
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }
  function downloadReport() {
    const csv = Papa.unparse(report, { escapeFormulae: true });
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "reporte-batch-elitepc.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  const selectedItems = job?.items.filter((v) => selected[v.id]) || [];
  const current = job?.items.find((v) => v.id === specItem);
  const currentSpecs = current ? edits[current.id]?.specs || current.producto?.specs || [] : [];
  return (
    <>
      <div className="elite-page-header">
        <div>
          <h1>Batch IA</h1>
          <p>
            Pega, importa o escanea varios productos. Revisa las propuestas antes de guardarlas.
          </p>
        </div>
      </div>
      {error && (
        <div className="elite-notice is-error" role="alert">
          {error}
        </div>
      )}
      <section className="elite-card elite-batch">
        <div className="elite-toolbar">
          {[
            ["texto", "Texto"],
            ["archivo", "Excel/CSV"],
            ["imagen", "Imagen"],
          ].map(([key, label]) => (
            <button
              className={`elite-button ${tab === key ? "" : "secondary"}`}
              key={key}
              onClick={() => setTab(key!)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="elite-batch-options">
          <label>
            Categoría por defecto
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Detectar</option>
              {categories.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nombre}
                </option>
              ))}
            </select>
          </label>
          <label>
            Moneda
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="Detectar">Detectar</option>
              <option value="BOB">Bs</option>
              <option value="USD">USD</option>
            </select>
          </label>
          <label>
            Margen sobre precio de proveedor %
            <input
              type="number"
              min={0}
              max={1000}
              value={margin}
              onChange={(e) => setMargin(Number(e.target.value))}
            />
          </label>
          <label>
            <input type="checkbox" checked={models} onChange={(e) => setModels(e.target.checked)} />
            Buscar specs por modelo
          </label>
          <label>
            <input
              type="checkbox"
              checked={generate}
              onChange={(e) => setGenerate(e.target.checked)}
            />
            Generar destacados y puntos clave
          </label>
        </div>
        {tab === "texto" && (
          <>
            <textarea
              aria-label="Lista de productos"
              rows={10}
              maxLength={200000}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Pega el mensaje de tu proveedor o una lista de equipos"
            />
            <label>
              Separar productos por
              <select value={delimiter} onChange={(e) => setDelimiter(e.target.value)}>
                <option value="auto">Detección automática</option>
                <option value="blanco">Línea en blanco</option>
                <option value="linea">Cada línea</option>
                <option value="personalizado">Separador personalizado</option>
              </select>
            </label>
            {delimiter === "personalizado" && (
              <input
                aria-label="Separador"
                value={separator}
                onChange={(e) => setSeparator(e.target.value)}
              />
            )}
          </>
        )}
        {tab === "imagen" && (
          <ImagenesUploader value={images} onChange={setImages} disabled={busy || running} />
        )}
        {tab === "archivo" && (
          <>
            <label>
              1. Subir archivo Excel/CSV
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void loadFile(file);
                }}
              />
            </label>
            {sheets.length > 1 && (
              <label>
                Hoja
                <select
                  value={sheet}
                  onChange={async (e) => {
                    setSheet(e.target.value);
                    const XLSX = await import("xlsx");
                    if (book) setRows(XLSX.utils.sheet_to_json(book.Sheets[e.target.value]!));
                    setImportId("");
                  }}
                >
                  {sheets.map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
            )}
            {rows.length > 0 && !importId && (
              <button className="elite-button" disabled={busy} onClick={() => void importPreview()}>
                Continuar con {rows.length} filas
              </button>
            )}
            {importId && (
              <>
                <h2>2. Mapear columnas</h2>
                <label>
                  Reutilizar plantilla
                  <select
                    onChange={(e) => {
                      const t = templates.find((v) => v.nombre === e.target.value);
                      if (t) setMapping(t.mapeo);
                    }}
                  >
                    <option value="">Elige una plantilla</option>
                    {templates.map((v) => (
                      <option key={v.nombre}>{v.nombre}</option>
                    ))}
                  </select>
                </label>
                {columns.map((column) => (
                  <label key={column}>
                    {column}
                    <select
                      value={mapping[column] || "ignorar"}
                      onChange={(e) => setMapping((v) => ({ ...v, [column]: e.target.value }))}
                    >
                      {importFields.map((field) => (
                        <option key={field} value={field}>
                          {field}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
                <label>
                  Guardar plantilla con nombre
                  <input
                    value={template}
                    onChange={(e) => setTemplate(e.target.value)}
                    maxLength={80}
                  />
                </label>
                <h2>3. Vista previa y opciones</h2>
                <details>
                  <summary>Ver primeras 20 filas</summary>
                  <pre>{JSON.stringify(rows.slice(0, 20), null, 2)}</pre>
                </details>
                <label>
                  Si el SKU ya existe
                  <select value={duplicateMode} onChange={(e) => setDuplicateMode(e.target.value)}>
                    <option value="actualizar">Actualizar</option>
                    <option value="saltar">Saltar</option>
                    <option value="crear">Crear con SKU nuevo</option>
                  </select>
                </label>
                <label>
                  Sucursal para la columna Stock
                  <select value={branch} onChange={(e) => setBranch(e.target.value)}>
                    <option value="">No importar stock</option>
                    {branches.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.nombre}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={useAi}
                    onChange={(e) => setUseAi(e.target.checked)}
                  />
                  Usar IA para completar specs desde el título
                </label>
                <button
                  className="elite-button"
                  disabled={busy}
                  onClick={() => void confirmImport()}
                >
                  4. Pasar a revisión
                </button>
              </>
            )}
          </>
        )}
        {tab !== "archivo" && (
          <button
            className="elite-button"
            disabled={
              busy ||
              running ||
              (tab === "texto" && !text.trim()) ||
              (tab === "imagen" && !images.length)
            }
            onClick={() => void start()}
          >
            <Play size={15} />
            {busy ? "Preparando" : "Procesar"}
          </button>
        )}
      </section>
      {job && (
        <section className="elite-card elite-batch">
          <div className="elite-toolbar">
            <h2>
              Bandeja de revisión · {job.procesados} de {job.total} procesados
            </h2>
            {running ? (
              <button
                className="elite-button secondary"
                onClick={() => {
                  active.current = false;
                  setRunning(false);
                }}
              >
                <Pause size={15} />
                Pausar
              </button>
            ) : (
              <button
                className="elite-button secondary"
                disabled={busy}
                onClick={() => void process(job.id)}
              >
                Retomar procesamiento
              </button>
            )}
          </div>
          <progress
            value={job.procesados}
            max={Math.max(1, job.total)}
            aria-label="Progreso del trabajo"
          />
          <div className="elite-table-scroll">
            <table className="elite-products-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      aria-label="Seleccionar todas las propuestas"
                      onChange={(e) =>
                        setSelected(
                          Object.fromEntries(job.items.map((v) => [v.id, e.target.checked])),
                        )
                      }
                    />
                  </th>
                  {[
                    "Estado",
                    "SKU",
                    "Título",
                    "Categoría",
                    "Precio S/F",
                    "Specs",
                    "Duplicado",
                    "Acciones",
                  ].map((v) => (
                    <th key={v}>{v}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {job.items.map((item) => {
                  const product = { ...item.producto, ...edits[item.id] };
                  return (
                    <tr key={item.id}>
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`Seleccionar propuesta ${item.id}`}
                          checked={!!selected[item.id]}
                          onChange={(e) =>
                            setSelected((v) => ({ ...v, [item.id]: e.target.checked }))
                          }
                        />
                      </td>
                      <td>
                        <span className="elite-badge">
                          {{
                            en_cola: "En cola",
                            procesando: "Procesando",
                            listo: "Listo",
                            revisar: "Revisar",
                            duplicado: "Duplicado",
                            error: "Error",
                            guardado: "Guardado",
                            descartado: "Descartado",
                          }[item.estado] || item.estado}
                        </span>
                        {item.error && <small role="alert">{item.error}</small>}
                      </td>
                      <td>
                        <input
                          aria-label="SKU de propuesta"
                          value={product.sku || ""}
                          onChange={(e) => edit(item.id, { sku: e.target.value.toUpperCase() })}
                        />
                      </td>
                      <td>
                        <input
                          aria-label="Título de propuesta"
                          value={product.titulo || ""}
                          onChange={(e) => edit(item.id, { titulo: e.target.value })}
                        />
                      </td>
                      <td>
                        <select
                          aria-label="Categoría de propuesta"
                          value={product.categoriaId || ""}
                          onChange={(e) => edit(item.id, { categoriaId: e.target.value })}
                        >
                          <option value="">Elegir</option>
                          {categories.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.nombre}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          aria-label="Precio S/F de propuesta"
                          inputMode="decimal"
                          key={`${item.id}-${product.precioSinFactura}`}
                          defaultValue={
                            product.precioSinFactura ? String(product.precioSinFactura / 100) : ""
                          }
                          onBlur={(e) =>
                            edit(item.id, { precioSinFactura: parseAmount(e.target.value) })
                          }
                        />
                      </td>
                      <td>
                        <button onClick={() => setSpecItem(item.id)}>
                          {product.specs?.length || 0} specs
                        </button>
                      </td>
                      <td>
                        {item.duplicados?.length ? (
                          <>
                            <select
                              value={duplicates[item.id] || item.duplicados[0]?.id}
                              onChange={(e) =>
                                setDuplicates((v) => ({ ...v, [item.id]: e.target.value }))
                              }
                            >
                              {item.duplicados.map((v) => (
                                <option key={v.id} value={v.id}>
                                  {v.sku} {v.titulo}
                                </option>
                              ))}
                            </select>
                            <select
                              aria-label="Acción de duplicado"
                              value={actions[item.id] || job.opciones.duplicados || "actualizar"}
                              onChange={(e) =>
                                setActions((v) => ({ ...v, [item.id]: e.target.value }))
                              }
                            >
                              <option value="actualizar">Actualizar</option>
                              <option value="saltar">Saltar</option>
                              <option value="crear">Crear con SKU nuevo</option>
                            </select>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        {item.productoGuardadoId ? (
                          <Link href={`/admin/productos/${item.productoGuardadoId}`}>
                            Abrir guardado
                          </Link>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                localStorage.setItem(
                                  "borrador-producto-nuevo",
                                  JSON.stringify({ ...emptyProduct(), ...product }),
                                );
                                router.push("/admin/productos/nuevo");
                              }}
                            >
                              Abrir en formulario
                            </button>
                            <button
                              disabled={busy || running}
                              onClick={() => void save([item], "reintentar")}
                            >
                              Reintentar
                            </button>
                            <button
                              disabled={busy || running}
                              onClick={() => {
                                if (window.confirm("¿Descartar esta propuesta?"))
                                  void save([item], "descartar");
                              }}
                            >
                              Descartar
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="elite-toolbar">
            <button
              className="elite-button"
              disabled={busy || running || !selectedItems.length}
              onClick={() => void save(selectedItems)}
            >
              Guardar seleccionados
            </button>
            <button
              className="elite-button secondary"
              disabled={busy || running}
              onClick={() => void save(job.items.filter((v) => v.estado === "listo"))}
            >
              Guardar todos los Listos
            </button>
            <button
              className="elite-button secondary"
              disabled={busy || running}
              onClick={() => {
                if (window.confirm("¿Descartar todas las propuestas con error?"))
                  void save(
                    job.items.filter((v) => v.estado === "error"),
                    "descartar",
                  );
              }}
            >
              Descartar errores
            </button>
            {report.length > 0 && (
              <button className="elite-button secondary" onClick={downloadReport}>
                <Download size={15} />
                Descargar reporte CSV
              </button>
            )}
          </div>
          {report.length > 0 && (
            <p>
              {report.filter((v) => v.estado === "guardado").length} guardados ·{" "}
              {report.filter((v) => v.estado === "error").length} con error ·{" "}
              {report.filter((v) => v.estado === "saltado" || v.estado === "descartado").length}{" "}
              saltados
            </p>
          )}
        </section>
      )}
      <section className="elite-card">
        <h2>Historial de trabajos · últimos 30 días</h2>
        <ul className="elite-product-list">
          {history.map((v) => (
            <li key={v.id}>
              <Link href={`/admin/batch-ia?trabajo=${v.id}`}>
                <strong>
                  {v.tipoEntrada} · {v.procesados}/{v.total}
                </strong>
                <small>
                  {new Date(v.createdAt).toLocaleString("es-BO")} · {v.estado}
                </small>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <Dialog.Root
        open={!!current}
        onOpenChange={(open) => {
          if (!open) setSpecItem(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="elite-overlay" />
          <Dialog.Content className="elite-search-dialog">
            <Dialog.Title>Especificaciones de la propuesta</Dialog.Title>
            <Dialog.Description>Revisa antes de guardar.</Dialog.Description>
            {current &&
              currentSpecs.map((spec, i) => (
                <label key={i}>
                  {spec.campo}
                  <input
                    value={spec.valor}
                    onChange={(e) =>
                      edit(current.id, {
                        specs: currentSpecs.map((v, j) =>
                          j === i ? { ...v, valor: e.target.value, confirmado: true } : v,
                        ),
                      })
                    }
                  />
                </label>
              ))}
            <Dialog.Close className="elite-button">Listo</Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
