import "server-only";
import { inArray } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getSpecFields, PRODUCT_CATEGORIES, type ProductCategory } from "./component-fields";
import { parseProductForm, ProductInputError } from "./products";

export const CSV_MAX_BYTES = 1024 * 1024;
export const CSV_MAX_ROWS = 100;
const basicColumns = [
  "nombre",
  "marca",
  "identificador",
  "categoria",
  "fuente",
  "garantia_meses",
  "consumo_w",
];

/** Excel-compatible UTF-8 CSV. Quoted separators, escaped quotes and embedded newlines are supported. */
export function readCsv(text: string) {
  text = text.replace(/^\uFEFF/, "");
  if (text.includes("\0"))
    throw new ProductInputError("El archivo debe ser un CSV de texto UTF-8.");
  const delimiter = text.split(/\r?\n/, 1)[0]!.includes(";") ? ";" : ",";
  const rows: { line: number; cells: string[] }[] = [];
  let cells: string[] = [],
    value = "",
    quoted = false,
    closed = false,
    line = 1,
    start = 1;
  const cell = () => {
    cells.push(value.trim());
    value = "";
    closed = false;
  };
  const row = () => {
    cell();
    if (cells.some(Boolean)) rows.push({ line: start, cells });
    cells = [];
    if (rows.length > CSV_MAX_ROWS + 1)
      throw new ProductInputError("Importá hasta 100 productos por archivo.");
  };
  for (let i = 0; i < text.length; i++) {
    const char = text[i]!;
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          value += '"';
          i++;
        } else {
          quoted = false;
          closed = true;
        }
      } else {
        value += char;
        if (char === "\n") line++;
      }
      continue;
    }
    if (char === '"') {
      if (value.trim() || closed)
        throw new ProductInputError(`Comillas inválidas en la línea ${line}.`);
      value = "";
      quoted = true;
    } else if (char === delimiter) cell();
    else if (char === "\r" || char === "\n") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row();
      line++;
      start = line;
    } else if (closed) {
      if (!/\s/.test(char)) throw new ProductInputError(`Revisá el separador en la línea ${line}.`);
    } else value += char;
  }
  if (quoted) throw new ProductInputError("Hay comillas sin cerrar en el CSV.");
  if (value || cells.length || closed) row();
  return rows;
}

export function csvTemplate(category: ProductCategory) {
  const header = [...basicColumns, ...getSpecFields(category).map((field) => `spec.${field.path}`)];
  return "\uFEFF" + header.join(";") + "\r\n";
}

export function validateProductCsv(text: string) {
  const [head, ...rows] = readCsv(text);
  if (!head || !rows.length)
    throw new ProductInputError(
      "Añadí al menos un producto debajo de los encabezados de la plantilla.",
    );
  const headers = head.cells.map((value) => value.toLowerCase());
  const allowed = new Set([
    ...basicColumns,
    ...PRODUCT_CATEGORIES.flatMap((category) =>
      getSpecFields(category.key).map((field) => `spec.${field.path.toLowerCase()}`),
    ),
  ]);
  if (new Set(headers).size !== headers.length || headers.some((key) => !allowed.has(key)))
    throw new ProductInputError(
      "Hay columnas desconocidas o repetidas. Usá la plantilla descargable.",
    );
  for (const required of ["nombre", "marca", "identificador", "categoria"])
    if (!headers.includes(required)) throw new ProductInputError(`Falta la columna ${required}.`);
  const slugs = new Set<string>();
  const issues: string[] = [];
  const products: ReturnType<typeof parseProductForm>[] = [];
  for (const row of rows) {
    try {
      if (row.cells.length !== headers.length)
        throw new Error("La cantidad de columnas no coincide con el encabezado.");
      const record = Object.fromEntries(headers.map((key, index) => [key, row.cells[index]!]));
      const category = record.categoria as ProductCategory;
      if (!PRODUCT_CATEGORIES.some((item) => item.key === category))
        throw new Error("La categoría no es válida. Conservá la clave de la plantilla.");
      const form = new FormData();
      for (const [column, field] of Object.entries({
        nombre: "name",
        marca: "brand",
        identificador: "slug",
        categoria: "category",
        fuente: "source",
        garantia_meses: "warrantyMonths",
        consumo_w: "tdpW",
      }))
        form.set(field, record[column] || "");
      const fields = getSpecFields(category);
      for (const [key, value] of Object.entries(record))
        if (key.startsWith("spec.") && value) {
          const field = fields.find((item) => `spec.${item.path.toLowerCase()}` === key);
          if (!field) throw new Error(`La columna ${key} no corresponde a esta categoría.`);
          form.set(`spec.${field.path}`, value);
        }
      const product = parseProductForm(form);
      if (slugs.has(product.slug)) throw new Error(`Identificador repetido: ${product.slug}.`);
      slugs.add(product.slug);
      products.push(product);
    } catch (error) {
      issues.push(
        `Línea ${row.line}: ${error instanceof Error ? error.message : "Revisá los datos."}`,
      );
    }
  }
  if (issues.length) throw new ProductInputError(issues.slice(0, 15).join("\n"));
  return products;
}

export async function readProductCsvFile(form: FormData) {
  const file = form.get("csv");
  if (!(file instanceof File) || !file.size || file.size > CSV_MAX_BYTES)
    throw new ProductInputError("Elegí un CSV UTF-8 de hasta 1 MB y 100 productos.");
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(await file.arrayBuffer());
  } catch {
    throw new ProductInputError("Guardá el archivo como CSV UTF-8 desde Excel o LibreOffice.");
  }
  return validateProductCsv(text);
}

export async function importProductCsv(form: FormData) {
  const products = await readProductCsvFile(form);
  return getDb().transaction(async (tx) => {
    const existing = await tx
      .select({ slug: schema.components.slug })
      .from(schema.components)
      .where(
        inArray(
          schema.components.slug,
          products.map((item) => item.slug),
        ),
      );
    if (existing.length)
      throw new ProductInputError(
        `Estos identificadores ya existen: ${existing
          .slice(0, 10)
          .map((item) => item.slug)
          .join(", ")}. No se importó ningún producto.`,
      );
    await tx
      .insert(schema.components)
      .values(
        products.map((item) => ({
          slug: item.slug,
          category: item.category,
          brand: item.brand,
          model: item.name.slice(0, 120),
          nameDisplay: item.name,
          spec: item.spec,
          tdpW: item.tdpW,
          warrantyMonths: item.warrantyMonths,
          sources: item.source ? [{ url: item.source, fetchedAt: new Date().toISOString() }] : [],
          isActive: false,
        })),
      );
    return products.length;
  });
}

export async function previewProductCsv(form: FormData) {
  const products = await readProductCsvFile(form);
  const existing = await getDb()
    .select({ slug: schema.components.slug })
    .from(schema.components)
    .where(
      inArray(
        schema.components.slug,
        products.map((item) => item.slug),
      ),
    );
  if (existing.length)
    throw new ProductInputError(
      `Estos identificadores ya existen: ${existing
        .slice(0, 10)
        .map((item) => item.slug)
        .join(", ")}. Cambialos antes de importar.`,
    );
  return products;
}
