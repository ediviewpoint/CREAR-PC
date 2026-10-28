"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { saveManagedProductAction, type ProductActionState } from "@/app/_actions/products";
import type { ProductCategory, SpecField } from "@/lib/admin/component-fields";
import { ProductAiAssistant } from "./ProductAiAssistant";
import type { AiProductDraft } from "@/lib/admin/ai-products";
export type ProductEditorData = {
  id: string;
  name: string;
  brand: string;
  slug: string;
  category: ProductCategory;
  source: string;
  tdpW: number | null;
  warrantyMonths?: number | null;
  spec: Record<string, unknown>;
  isActive: boolean;
  version: string;
  photoUrl?: string;
  photoAlt?: string;
  photos?: { id: string; url: string; alt: string; isPrimary: boolean }[];
};
type Props = {
  initial?: ProductEditorData;
  categories: { key: ProductCategory; label: string }[];
  fieldSets: Record<ProductCategory, SpecField[]>;
  brands: string[];
  aiConfigured: boolean;
  commerce: {
    store: { name: string; city: string; active: boolean } | null;
    mode: "priced" | "quote";
    amount: string;
    stockQty: number | null;
    inStock: boolean;
    version: string;
  };
};
function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}
function fieldValue(spec: Record<string, unknown>, key: string) {
  const result = key
    .split(".")
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === "object" ? (node as Record<string, unknown>)[part] : undefined,
      spec,
    );
  return result === null || result === undefined
    ? ""
    : Array.isArray(result)
      ? result.join(", ")
      : String(result);
}
const optionLabels: Record<string, string> = {
  nvme_m2: "SSD NVMe M.2",
  ssd_sata: "SSD SATA",
  "hdd_3.5": "Disco duro de 3,5 pulgadas",
  "hdd_2.5": "Disco duro de 2,5 pulgadas",
  none: "Sin",
  semi: "Semimodular",
  full: "Completamente modular",
  glass: "Vidrio",
  mesh: "Malla",
  solid: "Sólido",
  "glass+mesh": "Vidrio y malla",
};
export function ProductEditor({
  initial,
  categories,
  fieldSets,
  brands,
  commerce,
  aiConfigured,
}: Props) {
  const [category, setCategory] = useState<ProductCategory>(initial?.category ?? "cpu");
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const slugEdited = useRef(!!initial);
  const [publish, setPublish] = useState(initial?.isActive ?? false);
  const [priceMode, setPriceMode] = useState(commerce.mode);
  const [preview, setPreview] = useState("");
  const [state, setState] = useState<ProductActionState>({ ok: false, message: "" });
  const [pending, start] = useTransition();
  const [aiBusy, setAiBusy] = useState(false);
  const [aiPatch, setAiPatch] = useState<{ draft: AiProductDraft; replace: boolean } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const appliedAiPatch = useRef<typeof aiPatch>(null);
  const submitting = useRef(false);
  const router = useRouter();
  useEffect(() => {
    if (
      !aiPatch ||
      !formRef.current ||
      appliedAiPatch.current === aiPatch ||
      aiPatch.draft.category !== category
    )
      return;
    appliedAiPatch.current = aiPatch;
    const { draft, replace } = aiPatch;
    const form = formRef.current;
    for (const [key, value] of Object.entries({
      brand: draft.brand,
      source: draft.source,
      ...Object.fromEntries(
        Object.entries(draft.fields).map(([path, entry]) => [`spec.${path}`, entry]),
      ),
    })) {
      const input = form.elements.namedItem(key);
      if (
        (input instanceof HTMLInputElement || input instanceof HTMLSelectElement) &&
        value !== "" &&
        (replace || !input.value.trim())
      )
        input.value = value;
    }
  }, [aiPatch, category]);
  useEffect(
    () => () => {
      if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  const fields = fieldSets[category];
  function errorFor(field: string) {
    return state.fields?.[field];
  }
  function errorNode(field: string) {
    return errorFor(field) ? (
      <span className="product-field-error" id={`error-${field}`}>
        {errorFor(field)}
      </span>
    ) : null;
  }
  return (
    <form
      ref={formRef}
      className="product-editor"
      onSubmit={(event) => {
        event.preventDefault();
        if (submitting.current) return;
        submitting.current = true;
        const form = event.currentTarget;
        const data = new FormData(form);
        const submitter = (event.nativeEvent as SubmitEvent).submitter;
        if (submitter instanceof HTMLButtonElement && submitter.value === "draft")
          data.delete("isActive");
        start(async () => {
          try {
            const result = await saveManagedProductAction(data);
            setState(result);
            if (result.ok && result.id) {
              if (submitter instanceof HTMLButtonElement && submitter.value === "draft")
                setPublish(false);
              setPreview("");
              const photo = form.elements.namedItem("photo");
              if (photo instanceof HTMLInputElement) photo.value = "";
              const remove = form.elements.namedItem("removePhoto");
              if (remove instanceof HTMLInputElement) remove.checked = false;
              const gallery = form.elements.namedItem("galleryPhotos");
              if (gallery instanceof HTMLInputElement) gallery.value = "";
              form.querySelectorAll<HTMLInputElement>('[name="deletePhotos"]').forEach((input) => {
                input.checked = false;
              });
              const primary = form.elements.namedItem("primaryPhoto");
              if (primary instanceof HTMLSelectElement) primary.value = "";
              if (!initial) router.replace(`/admin/componentes/${result.id}`);
              else router.refresh();
            }
          } catch {
            setState({
              ok: false,
              message: "No se pudo conectar. Tus datos siguen en el formulario; volvé a intentar.",
            });
          } finally {
            submitting.current = false;
          }
        });
      }}
      aria-busy={pending}
    >
      {initial && (
        <>
          <input type="hidden" name="id" value={initial.id} />
          <input type="hidden" name="version" value={initial.version} />
        </>
      )}
      <fieldset disabled={pending || aiBusy}>
        <ProductAiAssistant
          configured={aiConfigured}
          categories={categories}
          fieldSets={fieldSets}
          name={name}
          lockedCategory={initial?.category}
          onBusyChange={setAiBusy}
          onApply={(draft, replace) => {
            if (initial && draft.category !== initial.category)
              return "La categoría del producto existente no se puede cambiar. Revisá el modelo consultado.";
            if (
              !initial &&
              draft.category !== category &&
              !replace &&
              Array.from(formRef.current?.elements ?? []).some(
                (element) =>
                  (element instanceof HTMLInputElement || element instanceof HTMLSelectElement) &&
                  element.name.startsWith("spec.") &&
                  element.value.trim(),
              )
            )
              return "La propuesta cambia la categoría y reemplazaría especificaciones escritas a mano. Revisá el modelo o marcá Reemplazar campos ya completados para aplicar ese cambio.";
            if (!initial && draft.category !== category) setCategory(draft.category);
            if (replace || !name.trim()) {
              setName(draft.name);
              if (!initial && !slugEdited.current) setSlug(slugify(draft.name));
            }
            setAiPatch({ draft, replace });
          }}
        />
        <section className="product-editor__section">
          <div className="product-editor__section-title">
            <span className="mono">01</span>
            <div>
              <h2>Identificación</h2>
              <p>Usá el nombre y la referencia exacta que ofrecés.</p>
            </div>
          </div>
          <div className="product-editor__fields">
            <label>
              Nombre completo
              <input
                name="name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  if (!slugEdited.current) setSlug(slugify(event.target.value));
                }}
                required
                maxLength={180}
                aria-invalid={!!errorFor("name")}
                aria-describedby={errorFor("name") ? "error-name" : undefined}
              />
              {errorNode("name")}
            </label>
            <label>
              Marca
              <input
                name="brand"
                defaultValue={initial?.brand}
                required
                maxLength={60}
                list="product-brands"
                aria-invalid={!!errorFor("brand")}
              />
              {errorNode("brand")}
            </label>
            <datalist id="product-brands">
              {brands.map((brand) => (
                <option key={brand} value={brand} />
              ))}
            </datalist>
            <label>
              Categoría
              <select
                name="category"
                value={category}
                onChange={(event) => setCategory(event.target.value as ProductCategory)}
                disabled={!!initial}
              >
                {categories.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </select>
              {initial && <input type="hidden" name="category" value={category} />}
            </label>
            <label>
              Identificador para el enlace
              <input
                name="slug"
                value={slug}
                onChange={(event) => {
                  slugEdited.current = true;
                  setSlug(event.target.value);
                }}
                readOnly={!!initial}
                required
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                maxLength={120}
                aria-invalid={!!errorFor("slug")}
              />
              <span className="small muted">
                Se genera a partir del nombre. Queda fijo al crear el producto.
              </span>
              {errorNode("slug")}
            </label>
            <label>
              Fuente de la ficha técnica
              <input
                name="source"
                type="url"
                defaultValue={initial?.source}
                required={publish}
                placeholder="https://fabricante.com/producto"
                aria-invalid={!!errorFor("source")}
              />
              {errorNode("source")}
            </label>
            <label>
              Garantía comercial (meses)
              <input
                name="warrantyMonths"
                type="number"
                min={0}
                max={120}
                step={1}
                defaultValue={initial?.warrantyMonths ?? ""}
                aria-invalid={!!errorFor("warrantyMonths")}
              />
              <span className="small muted">
                Vacío: por confirmar. Cero: sin cobertura comercial adicional. Indicá solo la
                cobertura que ofrecés.
              </span>
              {errorNode("warrantyMonths")}
            </label>
            <label>
              Consumo eléctrico (W, opcional)
              <input
                name="tdpW"
                type="number"
                min={0}
                max={32767}
                step={1}
                defaultValue={initial?.tdpW ?? ""}
              />
              <span className="small muted">
                En CPU y GPU se puede tomar de la ficha. En refrigeración no es la capacidad de
                enfriamiento.
              </span>
            </label>
          </div>
        </section>
        <section className="product-editor__section">
          <div className="product-editor__section-title">
            <span className="mono">02</span>
            <div>
              <h2>Ficha técnica</h2>
              <p>
                Completá los datos del fabricante. Los obligatorios se verifican antes de publicar.
              </p>
            </div>
          </div>
          <div className="product-editor__fields" key={category}>
            {fields.map((field) => {
              const fieldName = `spec.${field.path}`,
                error = errorFor(fieldName);
              const defaults =
                initial?.category === category ? fieldValue(initial.spec, field.path) : "";
              return (
                <label key={field.path}>
                  {field.label}
                  {!field.required && <span className="product-field-optional">Opcional</span>}
                  {field.type === "boolean" || field.type === "select" ? (
                    <select
                      name={fieldName}
                      defaultValue={defaults}
                      required={publish && field.required}
                      aria-invalid={!!error}
                      aria-describedby={error ? `error-${fieldName}` : undefined}
                    >
                      <option value="">Sin informar</option>
                      {field.type === "boolean" ? (
                        <>
                          <option value="true">Sí</option>
                          <option value="false">No</option>
                        </>
                      ) : (
                        field.options?.map((option) => (
                          <option key={option} value={String(option)}>
                            {optionLabels[String(option)] ?? String(option)}
                          </option>
                        ))
                      )}
                    </select>
                  ) : (
                    <input
                      name={fieldName}
                      type={field.type === "number" ? "number" : "text"}
                      defaultValue={defaults}
                      min={field.min}
                      max={field.max}
                      step={field.integer ? 1 : "any"}
                      required={publish && field.required && field.type !== "array"}
                      maxLength={field.type === "number" ? undefined : 400}
                      aria-invalid={!!error}
                      aria-describedby={error ? `error-${fieldName}` : undefined}
                    />
                  )}
                  {field.type === "array" && (
                    <span className="small muted">
                      Separá los valores con comas.
                      {field.options
                        ? ` Opciones: ${field.options.join(", ")}.`
                        : " Dejá vacío si no admite ninguno."}
                    </span>
                  )}
                  {errorNode(fieldName)}
                </label>
              );
            })}
          </div>
        </section>
        <section className="product-editor__section">
          <div className="product-editor__section-title">
            <span className="mono">03</span>
            <div>
              <h2>Foto del producto</h2>
              <p>Una foto real del modelo exacto. JPG, PNG o WebP, hasta 3 MB.</p>
            </div>
          </div>
          <div className="product-photo-editor">
            {preview || initial?.photoUrl ? (
              <div className="product-photo-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview || initial?.photoUrl}
                  alt="Vista previa de la foto principal"
                  width={320}
                  height={240}
                />
              </div>
            ) : (
              <div className="product-photo-placeholder">
                <span>Foto opcional</span>
                <p>Sin foto, el catálogo utiliza el esquema de la categoría.</p>
              </div>
            )}
            <div className="product-editor__fields">
              <label>
                {initial?.photoUrl ? "Reemplazar foto" : "Elegir foto"}
                <input
                  name="photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  aria-invalid={!!errorFor("photo")}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) {
                      setPreview("");
                      return;
                    }
                    if (file.size > 3 * 1024 * 1024) {
                      event.target.value = "";
                      setPreview("");
                      setState({ ok: false, message: "La foto debe pesar como máximo 3 MB." });
                      return;
                    }
                    setPreview(URL.createObjectURL(file));
                  }}
                />
                {errorNode("photo")}
              </label>
              {(!initial?.photoUrl || preview) && (
                <label>
                  Descripción de la nueva foto
                  <input
                    name="photoAlt"
                    maxLength={240}
                    defaultValue={initial?.photoAlt}
                    placeholder="Vista frontal del producto"
                  />
                </label>
              )}
              {initial?.photoUrl && (
                <label className="check-label">
                  <input name="removePhoto" type="checkbox" />
                  Quitar la foto actual al guardar
                </label>
              )}
              <label>
                Añadir otras vistas
                <input
                  name="galleryPhotos"
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                />
                <span className="small muted">
                  Hasta 6 fotos en total, de 3 MB cada una. Las nuevas vistas se añaden a la
                  galería.
                </span>
              </label>
              <p className="small muted">
                La imagen se guarda con el producto y se mantiene al actualizar el sitio. No hace
                falta subirla a GitHub.
              </p>
            </div>
          </div>
          {!!initial?.photos?.length && (
            <>
              <label>
                Elegir foto principal
                <select name="primaryPhoto" defaultValue="">
                  <option value="">Mantener principal (o usar la nueva foto)</option>
                  {initial.photos.map((item, index) => (
                    <option key={item.id} value={item.id}>
                      Vista {index + 1}: {item.alt.slice(0, 70)}
                    </option>
                  ))}
                </select>
              </label>
              <div className="product-gallery-editor">
                {initial.photos.map((item, index) => (
                  <div key={item.id}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.url} alt={item.alt} width={160} height={120} />
                    <label>
                      Descripción de la vista {index + 1}
                      <input name={`imageAlt.${item.id}`} defaultValue={item.alt} maxLength={240} />
                    </label>
                    <label className="check-label">
                      <input name="deletePhotos" type="checkbox" value={item.id} />
                      Quitar vista {index + 1} al guardar
                    </label>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
        <section className="product-editor__section">
          <div className="product-editor__section-title">
            <span className="mono">04</span>
            <div>
              <h2>Precio y disponibilidad</h2>
              <p>Guardá tu precio y stock junto con el producto.</p>
            </div>
          </div>
          <input type="hidden" name="priceVersion" value={commerce.version} />
          <div className="product-editor__fields">
            <label className="check-label">
              <input
                type="radio"
                name="priceMode"
                value="priced"
                checked={priceMode === "priced"}
                onChange={() => setPriceMode("priced")}
              />
              Con precio
            </label>
            <label className="check-label">
              <input
                type="radio"
                name="priceMode"
                value="quote"
                checked={priceMode === "quote"}
                onChange={() => setPriceMode("quote")}
              />
              Por cotizar
            </label>
          </div>
          {errorNode("priceMode")}
          {priceMode === "quote" && (
            <p className="small muted">
              Sin precio propio. Si ya había uno, dejará de ofrecerse al guardar. Las cotizaciones
              de otras tiendas se gestionan en Precios.
            </p>
          )}
          <fieldset
            className="product-commerce-fields"
            hidden={priceMode !== "priced"}
            disabled={priceMode !== "priced"}
          >
            {commerce.store ? (
              <p>
                Tu tienda: <strong>{commerce.store.name}</strong> · {commerce.store.city}
                {!commerce.store.active && " · Desactivada"}
              </p>
            ) : (
              <>
                <p>
                  Registrá tu tienda una sola vez para empezar a vender con tus propios precios.
                </p>
                <div className="product-editor__fields">
                  <label>
                    Nombre de tu tienda
                    <input
                      name="ownStoreName"
                      required={priceMode === "priced"}
                      maxLength={120}
                      aria-invalid={!!errorFor("ownStoreName")}
                    />
                    {errorNode("ownStoreName")}
                  </label>
                  <label>
                    Ciudad de tu tienda
                    <input name="ownStoreCity" required={priceMode === "priced"} maxLength={80} />
                  </label>
                </div>
              </>
            )}
            <div className="product-editor__fields">
              <label>
                Precio de venta (Bs.)
                <input
                  name="priceAmount"
                  type="number"
                  min="0.01"
                  max="1000000"
                  step="0.01"
                  required={priceMode === "priced"}
                  defaultValue={commerce.amount}
                  aria-invalid={!!errorFor("priceAmount")}
                />
                {errorNode("priceAmount")}
              </label>
              <label>
                Cantidad disponible (opcional)
                <input
                  name="priceStockQty"
                  type="number"
                  min="0"
                  max="1000000"
                  step="1"
                  defaultValue={commerce.stockQty ?? ""}
                  aria-invalid={!!errorFor("priceStockQty")}
                />
                <span className="small muted">Vacío: cantidad por confirmar. Cero: sin stock.</span>
                {errorNode("priceStockQty")}
              </label>
              <label className="check-label">
                <input name="priceInStock" type="checkbox" defaultChecked={commerce.inStock} />
                Disponible para vender
              </label>
            </div>
            <p className="small muted">
              Tu precio se mantiene hasta que lo actualices. Guardar la ficha sin cambiar precio o
              stock conserva su historial.
            </p>
          </fieldset>
        </section>
        <section className="product-editor__section product-publication">
          <div>
            <h2>Publicación</h2>
            <p>
              Podés guardar una ficha incompleta como borrador. Publicá cuando los datos técnicos
              estén completos.
            </p>
          </div>
          <label className="check-label">
            <input
              name="isActive"
              type="checkbox"
              checked={publish}
              onChange={(event) => setPublish(event.target.checked)}
            />
            Publicar en el catálogo y configurador
          </label>
          <div className="product-editor__actions">
            <button className="button" type="submit">
              {pending ? "Guardando…" : publish ? "Guardar y publicar" : "Guardar borrador"}
            </button>
            {publish && (
              <button
                className="button button--ghost"
                type="submit"
                name="intent"
                value="draft"
                formNoValidate
              >
                Guardar borrador
              </button>
            )}
            <Link className="button button--ghost" href="/admin/componentes">
              Volver al listado
            </Link>
          </div>
        </section>
      </fieldset>
      {state.message && (
        <p className="product-editor__message" role={state.ok ? "status" : "alert"} tabIndex={-1}>
          {state.message}
        </p>
      )}
    </form>
  );
}
