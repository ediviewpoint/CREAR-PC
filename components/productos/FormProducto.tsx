"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { Dialog } from "radix-ui";
import { Save, ArrowUp, ArrowDown, Trash2, Check, History } from "lucide-react";
import { ProductSchema, emptyProduct, type ProductInput } from "@/lib/productos/schema";
import type { ProductFormData } from "@/lib/productos/form-data";
import { hasRole, type UserRole } from "@/lib/auth-permissions";
import { autoTitle } from "@/lib/productos/titulo";
import { parseAmount, usdToBob, withInvoice, roundBob } from "@/lib/precios";
import { DescripcionEditor } from "./DescripcionEditor";
import { readOfflineDraft, writeOfflineDraft } from "@/lib/draft-db";
import { Reordenable } from "./Reordenable";
import { ImagenesUploader } from "./ImagenesUploader";
import { PasoExtraerIA } from "./PasoExtraerIA";
import { FuncionesIA } from "./FuncionesIA";
const iconNames = [
  "rayo",
  "disquete",
  "globo",
  "candado",
  "chip",
  "bateria",
  "pantalla",
  "wifi",
  "escudo",
  "pluma",
];
function Amount({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: number | null | undefined;
  onChange: (n: number | null) => void;
  disabled?: boolean;
}) {
  return (
    <label>
      {label}
      <input
        key={String(value)}
        aria-label={label}
        inputMode="decimal"
        defaultValue={value == null ? "" : String(value / 100)}
        disabled={disabled}
        onBlur={(event) => {
          const raw = event.target.value.trim();
          const parsed = raw ? parseAmount(raw) : null;
          if (raw && parsed === null) {
            event.target.setCustomValidity("Ingresa un monto válido");
            event.target.reportValidity();
            return;
          }
          event.target.setCustomValidity("");
          onChange(parsed);
        }}
      />
    </label>
  );
}
export function FormProducto({
  data,
  role,
  id,
  initial,
}: {
  data: ProductFormData;
  role: UserRole;
  id?: string;
  initial?: Partial<ProductInput>;
}) {
  const router = useRouter();
  const search = useSearchParams();
  const back = search.get("volver")?.startsWith("/admin/productos")
    ? search.get("volver")!
    : "/admin/productos";
  const editor = hasRole(role, "EDITOR");
  const defaults = {
    ...emptyProduct(),
    sku: "",
    titulo: "",
    estado: "publicado" as const,
    ...initial,
    stocks: initial?.stocks || data.branches.map((b) => ({ sucursalId: b.id, cantidad: 0 })),
    destacados: initial?.destacados?.length
      ? initial.destacados
      : Array.from({ length: 4 }, () => ({ icono: "chip", texto: "", origen: "MANUAL" as const })),
    puntosClave: initial?.puntosClave?.length
      ? initial.puntosClave
      : [
          { titulo: "Rendimiento en IA", descripcion: "", enPdf: true, origen: "MANUAL" as const },
          { titulo: "Multitarea", descripcion: "", enPdf: true, origen: "MANUAL" as const },
        ],
  };
  // Los métodos mutables de react-hook-form se usan sin memoización del compilador.
  const form = useForm<ProductInput>({ defaultValues: defaults });
  const values = useWatch({ control: form.control }) as ProductInput;
  const specs = useFieldArray({ control: form.control, name: "specs" });
  const highlights = useFieldArray({ control: form.control, name: "destacados" });
  const keys = useFieldArray({ control: form.control, name: "puntosClave" });
  const groups = useFieldArray({ control: form.control, name: "gruposOpciones" });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(search.get("guardado") === "1" ? "Producto guardado" : "");
  const [error, setError] = useState(false);
  const [draft, setDraft] = useState<ProductInput | null>(null);
  const [online, setOnline] = useState(true);
  const [currency, setCurrency] = useState("BOB");
  const [tag, setTag] = useState("");
  const [confirm, setConfirm] = useState<{ title: string; run: () => void } | null>(null);
  const [conflict, setConflict] = useState<Partial<ProductInput> | null>(null);
  const dirty = form.formState.isDirty;
  const leaving = useRef(false);
  const lastCategory = useRef(initial?.categoriaId || "");
  const saveRef = useRef<(state: ProductInput["estado"], another?: boolean) => void>(() => {});
  const category = data.categories.find((c) => c.id === values.categoriaId);
  useEffect(() => {
    if (id)
      void readOfflineDraft(`borrador-producto-${id}`)
        .then((value) => {
          if (value && typeof value === "object") setDraft(value as ProductInput);
        })
        .catch(() => {});
  }, [id]);
  useEffect(() => {
    if (message && !error) {
      const timer = setTimeout(() => setMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);
  useEffect(() => {
    if (!id) {
      try {
        const saved = localStorage.getItem("borrador-producto-nuevo");
        if (saved) queueMicrotask(() => setDraft(JSON.parse(saved)));
      } catch {}
      void fetch("/api/productos/sku/siguiente")
        .then((r) => r.json())
        .then((v) => {
          if (v.sku && !form.getValues("sku")) form.setValue("sku", v.sku);
        })
        .catch(() => {});
    }
  }, [id, form]);
  useEffect(() => {
    if (!values.tituloManual) {
      const title = autoTitle(
        {
          marca: values.marca || "",
          modelo: values.modelo || "",
          partNumber: values.partNumber || "",
          specs: values.specs || [],
        },
        category?.plantillaTitulo,
      );
      if (title && title !== form.getValues("titulo")) form.setValue("titulo", title);
    }
  }, [
    values.marca,
    values.modelo,
    values.partNumber,
    values.specs,
    values.tituloManual,
    category?.plantillaTitulo,
    form,
  ]);
  useEffect(() => {
    if (!category) return;
    const current = form.getValues("specs");
    const missing = category.specsSugeridas.filter(
      (v) => !current.some((s) => s.campo.toLowerCase() === v.campo.toLowerCase()),
    );
    if (missing.length)
      form.setValue(
        "specs",
        [
          ...current,
          ...missing.map((v) => ({
            campo: v.campo,
            valor: "",
            icono: v.icono || null,
            origen: "MANUAL" as const,
            confirmado: true,
          })),
        ],
        { shouldDirty: !!lastCategory.current && lastCategory.current !== category.id },
      );
    form.setValue("categoriaNombre", category.nombre);
    lastCategory.current = category.id;
  }, [category, form]);
  useEffect(() => {
    if (id || !dirty) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem("borrador-producto-nuevo", JSON.stringify(form.getValues()));
      } catch {}
    }, 20000);
    return () => clearTimeout(timer);
  }, [values, dirty, id, form]);
  useEffect(() => {
    const unload = (event: BeforeUnloadEvent) => {
      if (dirty && !leaving.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const click = (event: MouseEvent) => {
      const link = (event.target as HTMLElement).closest("a");
      if (
        dirty &&
        !leaving.current &&
        link?.href &&
        link.origin === location.origin &&
        !link.hash &&
        !window.confirm("Hay cambios sin guardar. ¿Quieres salir?")
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    const key = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveRef.current("publicado");
      }
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", click, true);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", click, true);
      window.removeEventListener("keydown", key);
    };
  }, [dirty]);
  useEffect(() => {
    const update = () => {
      setOnline(navigator.onLine);
      if (!navigator.onLine) {
        void writeOfflineDraft(
          id ? `borrador-producto-${id}` : "borrador-producto-nuevo",
          form.getValues(),
        ).catch(() => {});
        try {
          localStorage.setItem(
            id ? `borrador-producto-${id}` : "borrador-producto-nuevo",
            JSON.stringify(form.getValues()),
          );
        } catch {}
      }
    };
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, [id, form]);
  function change<K extends keyof ProductInput>(key: K, value: ProductInput[K]) {
    form.setValue(key, value as never, { shouldDirty: true });
  }
  async function save(state: ProductInput["estado"], another = false) {
    if (!editor || busy) return;
    form.clearErrors();
    const raw = { ...form.getValues(), estado: state };
    if (role !== "ADMIN") {
      delete raw.costo;
      delete raw.monedaCosto;
    }
    const parsed = ProductSchema.safeParse(raw);
    if (!parsed.success) {
      for (const issue of parsed.error.issues)
        form.setError(issue.path.join(".") as keyof ProductInput, { message: issue.message });
      const first = parsed.error.issues[0]?.path.join(".");
      if (first) form.setFocus(first as keyof ProductInput);
      setMessage("Revisa los campos marcados");
      setError(true);
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(id ? `/api/productos/${id}` : "/api/productos", {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const result = await response.json();
      if (!response.ok) {
        if (result.error?.code === "CONFLICTO_VERSION")
          setConflict(result.error.detail?.producto || {});
        for (const [field, msg] of Object.entries(result.error?.fields || {}))
          form.setError(field as keyof ProductInput, { message: String(msg) });
        throw new Error(result.error?.message || "No se pudo guardar");
      }
      form.reset({ ...form.getValues(), ...result });
      void writeOfflineDraft(
        id ? `borrador-producto-${id}` : "borrador-producto-nuevo",
        null,
      ).catch(() => {});
      setMessage("Producto guardado");
      setError(false);
      try {
        localStorage.removeItem("borrador-producto-nuevo");
      } catch {}
      if (another) {
        leaving.current = true;
        router.push(
          `/admin/productos/nuevo?categoria=${parsed.data.categoriaId}&nuevo=${Date.now()}`,
        );
        router.refresh();
      } else if (!id) {
        leaving.current = true;
        router.replace(`/admin/productos/${result.id}?guardado=1`);
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "No se pudo guardar");
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    saveRef.current = (state, another) => void save(state, another);
  });
  const err = (name: keyof ProductInput) => {
    const e = form.formState.errors[name];
    return e?.message ? (
      <small className="elite-field-error" role="alert">
        {String(e.message)}
      </small>
    ) : null;
  };
  const field = (
    name:
      | "marca"
      | "modelo"
      | "partNumber"
      | "sku"
      | "titulo"
      | "color"
      | "garantia"
      | "slug"
      | "etiquetaDescuento",
    label: string,
    extra?: ReactNode,
  ) => (
    <label>
      {label}
      <input
        aria-label={label}
        {...form.register(name)}
        list={name === "marca" ? "brand-options" : undefined}
        onChange={(event) => {
          form.register(name).onChange(event);
          if (name === "titulo") change("tituloManual", true);
        }}
      />
      {extra}
      {err(name)}
    </label>
  );
  function move(name: "specs" | "destacados" | "puntosClave", index: number, dir: number) {
    const values = form.getValues(name);
    const next = index + dir;
    if (next < 0 || next >= values.length) return;
    if (name === "specs") specs.move(index, next);
    if (name === "destacados") highlights.move(index, next);
    if (name === "puntosClave") keys.move(index, next);
  }
  const rowButtons = (
    name: "specs" | "destacados" | "puntosClave",
    index: number,
    onRemove: () => void,
  ) => (
    <span className="elite-row-buttons">
      <button type="button" aria-label="Mover antes" onClick={() => move(name, index, -1)}>
        <ArrowUp size={14} />
      </button>
      <button type="button" aria-label="Mover después" onClick={() => move(name, index, 1)}>
        <ArrowDown size={14} />
      </button>
      <button type="button" aria-label="Quitar fila" onClick={onRemove}>
        <Trash2 size={14} />
      </button>
    </span>
  );
  return (
    <>
      <Link href={back} className="elite-back">
        Regresar al listado
      </Link>
      <div className="elite-page-header">
        <div>
          <h1>{id ? `Editar: ${values.sku || ""}` : "Nuevo Producto"}</h1>
          <p>Usa la IA para extraer automáticamente, luego ajusta lo que necesites.</p>
        </div>
        {id && (
          <Link className="elite-button secondary" href={`/admin/productos/${id}/historial`}>
            <History size={16} />
            Historial
          </Link>
        )}
      </div>
      {!online && (
        <div className="elite-notice" role="status">
          Sin conexión. Tus cambios se guardan como borrador local.
        </div>
      )}
      {draft && (
        <div className="elite-notice">
          <span>Hay un borrador anterior.</span>
          <button
            type="button"
            onClick={() => {
              form.reset(draft);
              setDraft(null);
            }}
          >
            Continuar donde lo dejaste
          </button>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem("borrador-producto-nuevo");
              setDraft(null);
            }}
          >
            Empezar de cero
          </button>
        </div>
      )}
      {message && (
        <div
          className={`elite-notice ${error ? "is-error" : ""}`}
          role={error ? "alert" : "status"}
        >
          {message}
          <Link href={back}>Ver en listado</Link>
          <button onClick={() => setMessage("")} aria-label="Cerrar aviso">
            Cerrar
          </button>
        </div>
      )}
      {editor && (
        <>
          <PasoExtraerIA
            editing={!!id}
            getProduct={form.getValues}
            onApply={(value) => form.reset(value, { keepDefaultValues: true })}
          />
          <FuncionesIA
            getProduct={form.getValues}
            onApply={(value) => form.reset(value, { keepDefaultValues: true })}
          />
        </>
      )}
      <form
        id="revisar-producto"
        className="elite-product-form"
        onSubmit={(event) => {
          event.preventDefault();
          void save("publicado");
        }}
      >
        <fieldset disabled={!editor || busy}>
          <div className="elite-form-columns">
            <div>
              <section className="elite-card">
                <h2>Información del producto</h2>
                <label>
                  Producto de carrito
                  <select {...form.register("tipo")}>
                    <option value="CARRITO">Sí</option>
                    <option value="IMAGEN">No, solo imagen</option>
                  </select>
                </label>
                <div className="elite-field-grid">
                  {field("marca", "Marca")}
                  {field("modelo", "Modelo")}
                  {field("partNumber", "Part number (P/N)")}
                  {field(
                    "sku",
                    "SKU / Código",
                    <button
                      type="button"
                      onClick={() =>
                        void fetch("/api/productos/sku/siguiente")
                          .then((r) => r.json())
                          .then((v) => v.sku && change("sku", v.sku))
                      }
                    >
                      Generar
                    </button>,
                  )}
                </div>
                <datalist id="brand-options">
                  {data.brands.map((brand) => (
                    <option key={brand} value={brand} />
                  ))}
                </datalist>
                {field("titulo", "Título")}
                <button
                  type="button"
                  className="elite-text-button"
                  onClick={() => change("tituloManual", false)}
                >
                  Restaurar título automático
                </button>
                <div className="elite-field-grid">
                  <label>
                    Categoría
                    <select {...form.register("categoriaId")}>
                      <option value="">Elige una categoría</option>
                      {data.categories
                        .filter((c) => !c.padreId)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nombre}
                          </option>
                        ))}
                    </select>
                    {err("categoriaId")}
                  </label>
                  <label>
                    Subcategoría
                    <select
                      {...form.register("subcategoriaId")}
                      onChange={(event) => change("subcategoriaId", event.target.value || null)}
                    >
                      <option value="">Sin subcategoría</option>
                      {data.categories
                        .filter((c) => c.padreId === values.categoriaId)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nombre}
                          </option>
                        ))}
                    </select>
                  </label>
                  {field("color", "Color")}
                  {field("garantia", "Garantía")}
                  <label>
                    Condición
                    <select {...form.register("condicion")}>
                      <option value="NUEVO">Nuevo</option>
                      <option value="REACONDICIONADO">Reacondicionado</option>
                      <option value="OPEN_BOX">Open box</option>
                      <option value="USADO">Usado</option>
                    </select>
                  </label>
                  <label>
                    Proveedor
                    <input
                      {...form.register("proveedorId")}
                      placeholder="Nombre o referencia del proveedor"
                    />
                  </label>
                </div>
              </section>
              {values.tipo === "CARRITO" && (
                <>
                  <section className="elite-card">
                    <h2>Precio</h2>
                    <p>
                      Llena solo S/F, solo C/F o ambos. Se muestran los precios que ingreses, con su
                      etiqueta y sin tachar.
                    </p>
                    <label>
                      Moneda de ingreso
                      <select
                        value={currency}
                        onChange={(event) => setCurrency(event.target.value)}
                      >
                        <option value="BOB">Bs</option>
                        <option value="USD">$us</option>
                      </select>
                    </label>
                    {currency === "USD" && (
                      <Amount
                        label="Precio en USD"
                        value={values.precioUsd}
                        onChange={(n) => {
                          change("precioUsd", n);
                          change(
                            "precioSinFactura",
                            n ? usdToBob(n, data.settings.rate, data.settings.round) : null,
                          );
                          change("tipoCambioUsado", data.settings.rate);
                        }}
                      />
                    )}
                    <div className="elite-field-grid">
                      {(
                        [
                          ["precioSinFactura", "Sin factura (S/F)"],
                          ["precioConFactura", "Con factura (C/F)"],
                          ["precioOferta", "Precio oferta"],
                          ["precioMayorista", "Precio mayorista"],
                        ] as const
                      ).map(([name, label]) => (
                        <div key={name}>
                          <Amount
                            label={label}
                            value={values[name]}
                            onChange={(n) =>
                              change(name, n ? roundBob(n, data.settings.round) : null)
                            }
                          />
                          {err(name)}
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="elite-button secondary"
                      disabled={!values.precioSinFactura}
                      onClick={() =>
                        change(
                          "precioConFactura",
                          withInvoice(
                            values.precioSinFactura!,
                            data.settings.markup,
                            data.settings.round,
                          ),
                        )
                      }
                    >
                      Calcular C/F ({data.settings.markup}%)
                    </button>
                    {field("etiquetaDescuento", "Descuento / etiqueta")}
                    <div className="elite-field-grid">
                      {(["ofertaDesde", "ofertaHasta"] as const).map((name) => (
                        <label key={name}>
                          {name === "ofertaDesde" ? "Oferta desde" : "Oferta hasta"}
                          <input
                            type="date"
                            value={values[name]?.slice(0, 10) || ""}
                            onChange={(event) =>
                              change(
                                name,
                                event.target.value
                                  ? new Date(
                                      `${event.target.value}T${name === "ofertaHasta" ? "23:59:59" : "00:00:00"}-04:00`,
                                    ).toISOString()
                                  : null,
                              )
                            }
                          />
                          {err(name)}
                        </label>
                      ))}
                    </div>
                    {role === "ADMIN" && (
                      <>
                        <Amount
                          label="Costo"
                          value={values.costo}
                          onChange={(n) => change("costo", n)}
                        />
                        <label>
                          Moneda del costo
                          <select
                            value={values.monedaCosto || "BOB"}
                            onChange={(event) =>
                              change("monedaCosto", event.target.value as "BOB" | "USD")
                            }
                          >
                            <option value="BOB">Bs</option>
                            <option value="USD">$us</option>
                          </select>
                        </label>
                        {!!values.costo && !!values.precioSinFactura && (
                          <p>
                            Margen:{" "}
                            {(
                              (1 -
                                (values.costo *
                                  (values.monedaCosto === "USD" ? data.settings.rate : 1)) /
                                  values.precioSinFactura) *
                              100
                            ).toFixed(1)}
                            %
                            {values.costo *
                              (values.monedaCosto === "USD" ? data.settings.rate : 1) >
                              values.precioSinFactura && " · Estás vendiendo por debajo del costo"}
                          </p>
                        )}
                      </>
                    )}
                  </section>
                  <section className="elite-card">
                    <h2>Inventario y disponibilidad</h2>
                    <label>
                      Disponibilidad
                      <select {...form.register("disponibilidad")}>
                        <option value="EN_STOCK">En stock</option>
                        <option value="SIN_STOCK">Sin stock</option>
                        <option value="BAJO_PEDIDO">Bajo pedido</option>
                      </select>
                    </label>
                    <label className="elite-check">
                      <input type="checkbox" {...form.register("controlaInventario")} />
                      Controlar inventario
                    </label>
                    {values.controlaInventario ? (
                      values.stocks?.map((stock, index) => (
                        <label key={stock.sucursalId}>
                          {data.branches.find((b) => b.id === stock.sucursalId)?.nombre}
                          <input
                            type="number"
                            min={0}
                            max={99999}
                            {...form.register(`stocks.${index}.cantidad`, { valueAsNumber: true })}
                          />
                        </label>
                      ))
                    ) : (
                      <p>
                        Si no llevas inventario, déjalo en 99999. La disponibilidad se maneja a
                        mano.
                      </p>
                    )}
                    <strong>
                      Total:{" "}
                      {values.controlaInventario
                        ? values.stocks?.reduce((s, v) => s + (Number(v.cantidad) || 0), 0)
                        : 99999}
                    </strong>
                    <label>
                      Umbral de stock bajo
                      <input
                        type="number"
                        min={0}
                        max={99999}
                        value={values.umbralStockBajo ?? data.settings.threshold}
                        onChange={(event) => change("umbralStockBajo", Number(event.target.value))}
                      />
                    </label>
                  </section>
                </>
              )}
              <section className="elite-card">
                <h2>Imágenes</h2>
                <ImagenesUploader
                  value={values.imagenes || []}
                  onChange={(images) => change("imagenes", images)}
                  disabled={!editor || busy}
                />
              </section>
              <section className="elite-card">
                <h2>Visibilidad y publicación</h2>
                <label className="elite-check">
                  <input type="checkbox" {...form.register("escondido")} />
                  Esconder
                </label>
                <p>Oculta este producto si no quieres mostrarlo.</p>
                <label className="elite-check">
                  <input type="checkbox" {...form.register("destacado")} />
                  Destacado
                </label>
                {field("slug", "Slug")}
                <label>
                  Estado
                  <select {...form.register("estado")}>
                    <option value="publicado">Publicado</option>
                    <option value="borrador">Borrador</option>
                    <option value="archivado">Archivado</option>
                  </select>
                </label>
                <label className="elite-check">
                  <input type="checkbox" {...form.register("requiereRevision")} />
                  Requiere revisión
                </label>
              </section>
            </div>
            <div>
              <section className="elite-card">
                <h2>Puntos destacados</h2>
                <p>Tarjetitas con icono en el PDF · idealmente 4 puntos cortos.</p>
                <Reordenable onMove={highlights.move}>
                  {highlights.fields.map((item, i) => (
                    <div className="elite-editor-row" key={item.id}>
                      <select
                        aria-label={`Ícono del destacado ${i + 1}`}
                        {...form.register(`destacados.${i}.icono`)}
                      >
                        {iconNames.map((name) => (
                          <option key={name}>{name}</option>
                        ))}
                      </select>
                      <input
                        aria-label={`Punto destacado ${i + 1}`}
                        maxLength={40}
                        {...form.register(`destacados.${i}.texto`)}
                      />
                      {rowButtons("destacados", i, () => highlights.remove(i))}
                    </div>
                  ))}
                </Reordenable>
                <button
                  type="button"
                  disabled={highlights.fields.length >= 6}
                  onClick={() => highlights.append({ icono: "chip", texto: "", origen: "MANUAL" })}
                >
                  Agregar punto
                </button>
                {err("destacados")}
              </section>
              <section className="elite-card">
                <h2>Puntos clave</h2>
                <Reordenable onMove={keys.move}>
                  {keys.fields.map((item, i) => (
                    <div className="elite-key-editor" key={item.id}>
                      <input
                        aria-label={`Título de punto clave ${i + 1}`}
                        {...form.register(`puntosClave.${i}.titulo`)}
                      />
                      <textarea
                        aria-label={`Descripción de punto clave ${i + 1}`}
                        maxLength={220}
                        {...form.register(`puntosClave.${i}.descripcion`)}
                      />
                      <label className="elite-check">
                        <input type="checkbox" {...form.register(`puntosClave.${i}.enPdf`)} />
                        En PDF
                      </label>
                      {rowButtons("puntosClave", i, () => keys.remove(i))}
                    </div>
                  ))}
                </Reordenable>
                <button
                  type="button"
                  disabled={keys.fields.length >= 4}
                  onClick={() =>
                    keys.append({
                      titulo: "Nuevo punto",
                      descripcion: "",
                      enPdf: true,
                      origen: "MANUAL",
                    })
                  }
                >
                  Agregar punto clave
                </button>
                {err("puntosClave")}
              </section>
              <section className="elite-card">
                <h2>Especificaciones técnicas · {specs.fields.length} campos</h2>
                <Reordenable onMove={specs.move}>
                  {specs.fields.map((item, i) => (
                    <div
                      className={`elite-editor-row ${values.specs?.[i]?.confianza === "BAJA" && !values.specs[i]?.confirmado ? "needs-review" : ""}`}
                      key={item.id}
                    >
                      <input
                        aria-label={`Campo técnico ${i + 1}`}
                        {...form.register(`specs.${i}.campo`)}
                      />
                      <input
                        aria-label={`Valor técnico ${i + 1}`}
                        {...form.register(`specs.${i}.valor`)}
                        onChange={(event) => {
                          form.register(`specs.${i}.valor`).onChange(event);
                          form.setValue(`specs.${i}.confirmado`, true);
                        }}
                        onPaste={(event) => {
                          const text = event.clipboardData.getData("text");
                          const rows = text
                            .split(/\r?\n/)
                            .map((line) => line.match(/^([^:]+):\s*(.+)$/))
                            .filter(Boolean);
                          if (rows.length > 1) {
                            event.preventDefault();
                            specs.append(
                              rows.map((row) => ({
                                campo: row![1]!.trim(),
                                valor: row![2]!.trim(),
                                origen: "MANUAL",
                                confirmado: true,
                              })),
                            );
                          }
                        }}
                      />
                      <button
                        type="button"
                        aria-label="Confirmar especificación"
                        onClick={() =>
                          form.setValue(`specs.${i}.confirmado`, true, { shouldDirty: true })
                        }
                      >
                        <Check size={15} />
                      </button>
                      {rowButtons("specs", i, () => specs.remove(i))}
                    </div>
                  ))}
                </Reordenable>
                <button
                  type="button"
                  onClick={() =>
                    specs.append({
                      campo: "Nuevo campo",
                      valor: "",
                      origen: "MANUAL",
                      confirmado: true,
                    })
                  }
                >
                  Agregar campo
                </button>
                {err("specs")}
              </section>
              <section className="elite-card">
                <h2>Descripción</h2>
                <DescripcionEditor
                  value={values.descripcion || ""}
                  onChange={(value) => change("descripcion", value)}
                  disabled={!editor || busy}
                />
                {err("descripcion")}
              </section>
              <section className="elite-card">
                <h2>Etiquetas</h2>
                <div className="elite-filter-chips">
                  {values.etiquetas?.map((name) => (
                    <button
                      type="button"
                      key={name}
                      onClick={() =>
                        change(
                          "etiquetas",
                          values.etiquetas.filter((v) => v !== name),
                        )
                      }
                    >
                      {name} ×
                    </button>
                  ))}
                </div>
                <input
                  aria-label="Agregar etiqueta"
                  placeholder="Agrega etiquetas (ej: marca, tipo, beneficio)"
                  value={tag}
                  onChange={(event) => setTag(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === ",") {
                      event.preventDefault();
                      const next = tag.trim().toUpperCase();
                      if (next && !values.etiquetas.some((v) => v.toUpperCase() === next))
                        change("etiquetas", [...values.etiquetas, next]);
                      setTag("");
                    }
                  }}
                />
                <div className="elite-filter-chips">
                  Sugeridas:{" "}
                  {[...new Set([values.marca, ...data.tags])]
                    .filter(Boolean)
                    .slice(0, 8)
                    .map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => {
                          if (!values.etiquetas.includes(name))
                            change("etiquetas", [...values.etiquetas, name]);
                        }}
                      >
                        + {name}
                      </button>
                    ))}
                </div>
              </section>
              <section className="elite-card">
                <h2>Opciones adicionales</h2>
                {groups.fields.map((item, i) => (
                  <div key={item.id} className="elite-key-editor">
                    <input
                      aria-label="Nombre del grupo"
                      {...form.register(`gruposOpciones.${i}.nombre`)}
                    />
                    <label className="elite-check">
                      <input
                        type="checkbox"
                        {...form.register(`gruposOpciones.${i}.obligatorio`)}
                      />
                      Obligatorio
                    </label>
                    <label className="elite-check">
                      <input type="checkbox" {...form.register(`gruposOpciones.${i}.multiple`)} />
                      Selección múltiple
                    </label>
                    {values.gruposOpciones[i]?.opciones.map((option, j) => (
                      <div className="elite-editor-row" key={j}>
                        <input
                          aria-label="Nombre de opción"
                          {...form.register(`gruposOpciones.${i}.opciones.${j}.nombre`)}
                        />
                        <Amount
                          label="Ajuste de precio Bs"
                          value={option.ajustePrecio}
                          onChange={(n) =>
                            change(
                              "gruposOpciones",
                              values.gruposOpciones.map((g, k) =>
                                k === i
                                  ? {
                                      ...g,
                                      opciones: g.opciones.map((o, l) =>
                                        l === j ? { ...o, ajustePrecio: n || 0 } : o,
                                      ),
                                    }
                                  : g,
                              ),
                            )
                          }
                        />
                        <button
                          type="button"
                          onClick={() =>
                            change(
                              "gruposOpciones",
                              values.gruposOpciones.map((g, k) =>
                                k === i
                                  ? { ...g, opciones: g.opciones.filter((_, l) => l !== j) }
                                  : g,
                              ),
                            )
                          }
                        >
                          Quitar
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        change(
                          "gruposOpciones",
                          values.gruposOpciones.map((g, k) =>
                            k === i
                              ? {
                                  ...g,
                                  opciones: [
                                    ...g.opciones,
                                    { nombre: "Nueva opción", ajustePrecio: 0 },
                                  ],
                                }
                              : g,
                          ),
                        )
                      }
                    >
                      Agregar opción
                    </button>
                    <button type="button" onClick={() => groups.remove(i)}>
                      Quitar grupo
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    groups.append({
                      nombre: "Nuevo grupo",
                      obligatorio: false,
                      multiple: false,
                      opciones: [],
                    })
                  }
                >
                  Agregar categoría de opciones +
                </button>
              </section>
            </div>
          </div>
        </fieldset>
        <div className="elite-form-sticky">
          <Link className="elite-button secondary" href={back}>
            Cancelar
          </Link>
          {id && role === "ADMIN" && (
            <button
              type="button"
              className="elite-button secondary"
              onClick={() =>
                setConfirm({
                  title: "¿Eliminar este producto? Podrás restaurarlo durante 30 días.",
                  run: () => {
                    void fetch(`/api/productos/${id}`, { method: "DELETE" })
                      .then(async (r) => {
                        if (!r.ok) throw new Error("No se pudo eliminar");
                        leaving.current = true;
                        router.push(back);
                      })
                      .catch((e) => {
                        setMessage(e.message);
                        setError(true);
                      });
                  },
                })
              }
            >
              Eliminar
            </button>
          )}
          {editor && (
            <>
              <button
                type="button"
                className="elite-button secondary"
                disabled={busy}
                onClick={() => void save("borrador")}
              >
                Guardar como borrador
              </button>
              <button
                type="button"
                className="elite-button secondary"
                disabled={busy}
                onClick={() => void save("publicado", true)}
              >
                Guardar y crear otro
              </button>
              <button type="submit" className="elite-button" disabled={busy || !online}>
                <Save size={15} />
                {busy ? "Guardando" : "Guardar"}
              </button>
            </>
          )}
        </div>
      </form>
      <Dialog.Root
        open={!!confirm}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="elite-overlay" />
          <Dialog.Content className="elite-search-dialog">
            <Dialog.Title>Confirmar</Dialog.Title>
            <Dialog.Description>{confirm?.title}</Dialog.Description>
            <div className="elite-toolbar">
              <Dialog.Close asChild>
                <button className="elite-button secondary">Cancelar</button>
              </Dialog.Close>
              <button
                className="elite-button"
                onClick={() => {
                  confirm?.run();
                  setConfirm(null);
                }}
              >
                Confirmar
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <Dialog.Root
        open={!!conflict}
        onOpenChange={(open) => {
          if (!open) setConflict(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="elite-overlay" />
          <Dialog.Content className="elite-search-dialog">
            <Dialog.Title>Otra persona editó este producto</Dialog.Title>
            <Dialog.Description>
              Revisa la versión guardada antes de combinar tus cambios. Tus datos siguen en el
              formulario.
            </Dialog.Description>
            <pre className="elite-conflict">{JSON.stringify(conflict, null, 2)}</pre>
            <button
              className="elite-button secondary"
              onClick={() => {
                if (conflict) form.reset({ ...form.getValues(), ...conflict });
                setConflict(null);
              }}
            >
              Cargar versión guardada
            </button>
            <button
              className="elite-button"
              onClick={() => {
                if (conflict?.updatedAt) form.setValue("updatedAt", conflict.updatedAt);
                setConflict(null);
              }}
            >
              Conservar mis cambios para revisar
            </button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
