import type { Extraction } from "./schemas";
import type { ProductInput } from "@/lib/productos/schema";
import { autoTitle } from "@/lib/productos/titulo";
import { usdToBob, roundBob, parseAmount } from "@/lib/precios";
export function limpiarEntrada(value: string) {
  const lines = value
    .replace(/\r\n?/g, "\n")
    .replace(/[“”″]/g, '"')
    .replace(/(\p{Extended_Pictographic})/gu, " $1 ")
    .split("\n")
    .map((v) => v.replace(/[ \t]+/g, " ").trim());
  const counts = new Map<string, number>();
  for (const line of lines) counts.set(line, (counts.get(line) || 0) + 1);
  const clean = lines.filter(
    (line, index) => !line || counts.get(line)! <= 3 || lines.indexOf(line) === index,
  );
  const text = clean.join("\n");
  if (text.length <= 20000) return text;
  return [text.slice(0, 6000), ...clean.filter((v) => /\d|GB|Bs|\$|MOD|:/i.test(v))]
    .join("\n")
    .slice(0, 20000);
}
export function normalizeSpec(campo: string, valor: string) {
  let value = valor.trim();
  if (/ram/i.test(campo))
    value = value.replace(/(\d+)\s*(?:gb|g)\b/gi, "$1 GB").replace(/ddr\s*(\d)/gi, "DDR$1");
  if (/almacenamiento|disco/i.test(campo))
    value = value
      .replace(/(\d+)\s*(gb|tb)/gi, (_, n, u) => `${n} ${u.toUpperCase()}`)
      .replace(/(\d+)\s*(ssd|ufs|hdd)/gi, "$1 GB $2")
      .replace(/\b(ssd|ufs|hdd)\b/gi, (v) => v.toUpperCase());
  if (/procesador/i.test(campo))
    value = value.replace(/\bcel\b/gi, "Celeron").replace(/^(Celeron|Pentium|Core)\b/i, "Intel $1");
  if (/sistema operativo/i.test(campo))
    value = value.replace(/^(?:W11S|Windows 11 S)$/i, "Windows 11 Home en modo S");
  if (/peso/i.test(campo) && /lb/i.test(value)) {
    const weight = Number(value.match(/[\d.]+/)?.[0]);
    if (weight) value = `${(weight * 0.45359237).toFixed(1)} kg`;
  }
  return value;
}
export function normalizeExtraction(
  raw: Extraction,
  categories: { id: string; nombre: string; plantillaTitulo: string | null }[],
  aliases: { tipo: string; valor: string; normalizado: string }[],
  rate: number,
  round = true,
  text = "",
) {
  const proposed: Partial<ProductInput> = {};
  const confidence: Record<string, string> = {};
  const notices = [...raw.avisos];
  for (const key of [
    "sku",
    "marca",
    "modelo",
    "partNumber",
    "color",
    "condicion",
    "garantia",
    "disponibilidad",
  ] as const) {
    const field = raw[key];
    if (field.valor !== null) {
      Object.assign(proposed, { [key]: field.valor });
      if (field.confianza) confidence[key] = field.confianza;
    }
  }
  if (proposed.marca) {
    proposed.marca =
      aliases.find(
        (a) => a.tipo === "marca" && a.valor.toLowerCase() === proposed.marca!.toLowerCase(),
      )?.normalizado || proposed.marca;
  }
  if (proposed.modelo)
    proposed.modelo = proposed.modelo
      .toUpperCase()
      .replace(
        new RegExp(`^${(proposed.marca || "_").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+`, "i"),
        "",
      )
      .replace(/[/\\]+\s*$/g, "")
      .replace(/\s+/g, " ")
      .trim();
  if (proposed.sku && !/^[A-Z]\d{3,5}$/.test(proposed.sku.toUpperCase())) {
    delete proposed.sku;
    notices.push("No se encontró un SKU válido");
  } else if (proposed.sku) proposed.sku = proposed.sku.toUpperCase();
  if (
    proposed.modelo &&
    proposed.marca &&
    proposed.modelo.startsWith(proposed.marca.toUpperCase() + " ")
  )
    proposed.modelo = proposed.modelo.slice(proposed.marca.length + 1);
  if (proposed.color)
    proposed.color = proposed.color.charAt(0).toUpperCase() + proposed.color.slice(1).toLowerCase();
  if (proposed.garantia) proposed.garantia = proposed.garantia.toLowerCase();
  if (proposed.modelo) {
    const parts = proposed.modelo.split(/\s+/);
    const code = parts.find((v) => /[A-Z]/.test(v) && /\d/.test(v));
    if (code) proposed.modelo = code;
    else if (!parts.some((v) => /^\d{3,}$/.test(v))) {
      delete proposed.modelo;
      notices.push("No se identificó un modelo comercial exacto");
    }
  }
  if (
    proposed.modelo &&
    /\b(NB|notebook|laptop)\b/i.test(text) &&
    !/\bMOD(?:ELO)?\s*[:.]/i.test(text) &&
    (text.toUpperCase().includes(`CEL ${proposed.modelo}`) ||
      text.toUpperCase().includes(`CELERON ${proposed.modelo}`))
  ) {
    delete proposed.modelo;
    notices.push("El código del procesador no se tomó como modelo del equipo");
  }
  if (!proposed.modelo && /^Memoria RAM\b/i.test(text)) {
    const code = text.match(/\bKF[A-Z0-9]+\/\d+\b/i)?.[0];
    if (code) proposed.modelo = code.toUpperCase();
  }
  const moneyMatches = [
    ...text.matchAll(/(\$us|USD|BOB|Bs\.?|\$)\s*([\d][\d.,]*)(?:\s*(S\s*\/\s*F|C\s*\/\s*F))?/gi),
  ]
    .map((match) => ({
      cents: parseAmount(match[2]!.replace(/[.,]+$/, "")),
      currency: /USD|\$/i.test(match[1]!) ? ("USD" as const) : ("BOB" as const),
      label: match[3]?.replace(/\s/g, "").toUpperCase(),
    }))
    .filter((v) => v.cents !== null && v.cents > 0);
  if (text && !/\bC\s*\/\s*F\b|con factura/i.test(text))
    raw.precio.conFactura = { valor: null, confianza: null };
  const normal = moneyMatches.filter((v) => v.label !== "C/F");
  const currency = normal.find((v) => v.currency === "BOB")?.currency || normal[0]?.currency;
  const same = normal.filter((v) => v.currency === currency).sort((a, b) => b.cents! - a.cents!);
  const ambiguous = same.length > 1 && same.at(-1)!.cents !== same[0]!.cents;
  if (same.length) {
    raw.precio.moneda = currency!;
    raw.precio.sinFactura = {
      valor: same[0]!.cents! / 100,
      confianza: ambiguous ? "baja" : "alta",
    };
    if (ambiguous) {
      raw.precio.oferta = { valor: same.at(-1)!.cents! / 100, confianza: "baja" };
      notices.push(
        "Se encontraron dos precios: el mayor se propuso como normal y el menor como oferta. Revisa ambos.",
      );
    }
  }
  const explicitUsd = normal.find((v) => v.currency === "USD");
  if (explicitUsd) proposed.precioUsd = explicitUsd.cents;
  const suggested =
    /\b(notebook|laptop|NB)\b/i.test(text) ||
    (/Celeron/i.test(text) && /\b\d{2}(?:\.\d)?\s*["”]/.test(text))
      ? "NOTEBOOK"
      : /^\s*Monitor\b/i.test(text)
        ? "MONITOR"
        : /\bImpresora\b/i.test(text)
          ? "IMPRESORA"
          : /^\s*(Memoria RAM|Disco|Placa madre)\b/i.test(text)
            ? "REPUESTO"
            : /\b(Teclado|Mouse|Adaptador)\b/i.test(text)
              ? "ACCESORIO"
              : null;
  const category =
    categories.find((c) => c.nombre.toUpperCase() === raw.categoria.valor?.trim().toUpperCase()) ||
    categories.find((c) => c.nombre === suggested);
  if (category) {
    proposed.categoriaId = category.id;
    proposed.categoriaNombre = category.nombre;
  }
  const specs = raw.specs
    .filter((spec) => {
      if (
        !text ||
        (text.toLowerCase().includes(spec.evidencia.trim().toLowerCase()) &&
          spec.evidencia.trim().length > 1 &&
          [...spec.valor.matchAll(/\d+(?:[.,]\d+)?/g)].every((match) =>
            spec.evidencia.replace(/,/g, ".").includes(match[0].replace(/,/g, ".")),
          ))
      )
        return true;
      notices.push(`${spec.campo}: se descartó un dato sin evidencia en el texto`);
      return false;
    })
    .map((spec) => ({
      campo: spec.campo,
      valor: normalizeSpec(spec.campo, spec.valor),
      confianza: spec.confianza.toUpperCase() as "ALTA" | "MEDIA" | "BAJA",
      origen: "TEXTO" as const,
      confirmado: spec.confianza !== "baja",
    }));
  proposed.specs = specs;
  for (const [from, to] of [
    ["sinFactura", "precioSinFactura"],
    ["conFactura", "precioConFactura"],
    ["oferta", "precioOferta"],
  ] as const) {
    const value = raw.precio[from];
    if (value.valor !== null && value.valor > 0) {
      const cents = Math.round(value.valor * 100);
      proposed[to] =
        raw.precio.moneda === "USD" ? usdToBob(cents, rate, round) : roundBob(cents, round);
      confidence[to] = value.confianza || "media";
      if (raw.precio.moneda === "USD") {
        if (from === "sinFactura") proposed.precioUsd = cents;
        proposed.tipoCambioUsado = rate;
      }
    }
  }
  if (raw.precio.moneda === "USD")
    notices.push(`Precio convertido desde USD con TC ${rate.toFixed(2)}`);
  if (!proposed.precioConFactura) notices.push("No se encontró precio con factura");
  if (proposed.marca || proposed.modelo)
    proposed.titulo = autoTitle(
      {
        marca: proposed.marca || "",
        modelo: proposed.modelo || "",
        partNumber: proposed.partNumber || "",
        specs,
      },
      category?.plantillaTitulo,
    );
  proposed.requiereRevision =
    Object.values(confidence).includes("baja") || specs.some((v) => !v.confirmado);
  proposed.textoFuente = text.slice(0, 20000);
  proposed.etiquetas = raw.etiquetasSugeridas;
  return {
    producto: proposed,
    confianza: confidence,
    origen: Object.fromEntries(Object.keys(proposed).map((k) => [k, "TEXTO"])),
    avisos: notices,
    imagenesSugeridas: raw.imagenesUrl,
  };
}
export function mergeExtraction(
  current: ProductInput,
  incoming: Partial<ProductInput>,
  mode: "vacios" | "reemplazar",
) {
  const next = structuredClone(current);
  for (const [key, value] of Object.entries(incoming)) {
    if (value === null || value === undefined || value === "" || key === "imagenes") continue;
    if (key === "specs") {
      const existing = next.specs;
      for (const spec of incoming.specs || []) {
        const index = existing.findIndex((v) => v.campo.toLowerCase() === spec.campo.toLowerCase());
        if (index < 0) existing.push(spec);
        else if (mode === "reemplazar" || !existing[index]!.valor) existing[index] = spec;
      }
      continue;
    }
    const before = next[key as keyof ProductInput];
    if (
      mode === "reemplazar" ||
      before === null ||
      before === undefined ||
      before === "" ||
      (Array.isArray(before) && before.length === 0)
    )
      Object.assign(next, { [key]: value });
  }
  return next;
}
