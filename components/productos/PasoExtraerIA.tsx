"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Dialog } from "radix-ui";
import { Bot, Undo2 } from "lucide-react";
import type { ProductInput } from "@/lib/productos/schema";
type Result = {
  producto: Partial<ProductInput>;
  confianza: Record<string, string>;
  avisos: string[];
  imagenesSugeridas: string[];
  posiblesDuplicados: { id: string; sku: string; titulo: string }[];
};
export function PasoExtraerIA({
  getProduct,
  onApply,
  editing,
  manualSku = false,
}: {
  getProduct: () => ProductInput;
  onApply: (data: ProductInput) => void;
  editing: boolean;
  manualSku?: boolean;
}) {
  const [text, setText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [merge, setMerge] = useState(false);
  const [search, setSearch] = useState(false);
  const [write, setWrite] = useState(true);
  const [currency, setCurrency] = useState("Detectar");
  const [previous, setPrevious] = useState<ProductInput | null>(null);
  async function run(mode: "vacios" | "reemplazar") {
    setMerge(false);
    setBusy(true);
    setError("");
    setStage("Leyendo texto");
    const snapshot = structuredClone(getProduct());
    try {
      const response = await fetch("/api/ia/extraer", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body: JSON.stringify({
          texto: text,
          imagenes: images,
          opciones: { buscarModelo: search, generarDestacados: write, moneda: currency },
        }),
        signal: AbortSignal.timeout(47000),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "No se pudo extraer");
      }
      let final: Result | null = null;
      if (response.headers.get("content-type")?.includes("text/event-stream")) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let index;
          while ((index = buffer.indexOf("\n\n")) >= 0) {
            const block = buffer.slice(0, index);
            buffer = buffer.slice(index + 2);
            const event = block.match(/^event: (.+)$/m)?.[1];
            const line = block.match(/^data: (.+)$/m)?.[1];
            if (!line) continue;
            const data = JSON.parse(line);
            if (event === "etapa") setStage(data.texto);
            if (event === "error") throw new Error(data.error.message);
            if (event === "resultado") final = data;
          }
        }
      } else final = await response.json();
      if (!final) throw new Error("La extracción no terminó. Intenta de nuevo");
      const { mergeExtraction } = await import("@/lib/ia/normalizar");
      const base = structuredClone(snapshot);
      if (!editing && !manualSku) base.sku = "";
      if (!editing && !base.tituloManual) base.titulo = "";
      if (base.destacados.every((v) => !v.texto)) base.destacados = [];
      if (base.puntosClave.every((v) => !v.descripcion)) base.puntosClave = [];
      const merged = mergeExtraction(base, final.producto, mode);
      if (!merged.sku) merged.sku = snapshot.sku;
      merged.requiereRevision =
        !!final.producto.requiereRevision ||
        merged.specs.some((v) => v.confianza === "BAJA" && !v.confirmado);
      setPrevious(snapshot);
      onApply(merged);
      setResult(final);
      document
        .getElementById("revisar-producto")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      setError(error instanceof Error ? error.message : "La IA tardó demasiado. Intenta de nuevo");
    } finally {
      setBusy(false);
    }
  }
  const controls = (
    <div className="elite-ai-step">
      <span className="elite-ai-label">PASO 1</span>
      <h2>Pega el texto de tu página web</h2>
      <p>Copia todo el contenido: título, precio, specs y emojis. La IA extrae todo.</p>
      <textarea
        rows={6}
        maxLength={20000}
        value={text}
        placeholder="Pega aquí todo el texto de la página del producto"
        aria-label="Texto para extraer con IA"
        disabled={busy}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            event.preventDefault();
            const p = getProduct();
            if (p.marca || p.modelo || p.specs.some((v) => v.valor)) setMerge(true);
            else void run("vacios");
          }
        }}
        onPaste={async (event) => {
          const file = [...event.clipboardData.files].find((v) => v.type.startsWith("image/"));
          if (file) {
            event.preventDefault();
            const form = new FormData();
            form.set("file", file);
            try {
              const response = await fetch("/api/uploads", { method: "POST", body: form });
              const image = await response.json();
              if (!response.ok) throw new Error(image.error?.message || "No se pudo subir");
              setImages((v) => [...v, image.url].slice(0, 3));
            } catch (error) {
              setError(error instanceof Error ? error.message : "No se pudo subir la imagen");
            }
          }
        }}
      />
      {text.length > 15000 && <small>{text.length}/20.000</small>}
      <div className="elite-ai-options">
        <label>
          <input
            type="checkbox"
            checked={search}
            disabled={busy}
            onChange={(event) => setSearch(event.target.checked)}
          />
          Completar specs faltantes buscando el modelo
        </label>
        <label>
          <input
            type="checkbox"
            checked={write}
            disabled={busy}
            onChange={(event) => setWrite(event.target.checked)}
          />
          Generar destacados y puntos clave
        </label>
        <label>
          Moneda del precio
          <select
            value={currency}
            disabled={busy}
            onChange={(event) => setCurrency(event.target.value)}
          >
            <option value="Detectar">Detectar</option>
            <option value="BOB">Bs</option>
            <option value="USD">USD</option>
          </select>
        </label>
      </div>
      {images.map((url) => (
        <button
          type="button"
          key={url}
          onClick={() => setImages((v) => v.filter((x) => x !== url))}
          aria-label="Quitar captura"
        >
          <Image unoptimized src={url} width={65} height={50} alt="Captura para leer con IA" />
        </button>
      ))}
      <button
        type="button"
        className="elite-button"
        disabled={busy || (text.trim().length < 20 && !images.length)}
        onClick={() => {
          const p = getProduct();
          if (p.marca || p.modelo || p.specs.some((v) => v.valor)) setMerge(true);
          else void run("vacios");
        }}
      >
        <Bot size={17} />
        {busy ? `Extrayendo · ${stage}` : "Extraer con IA"}
      </button>
      {busy && <progress aria-label={stage} />}
      <p role="alert">{error}</p>
    </div>
  );
  return (
    <>
      {editing ? (
        <details className="elite-reextract">
          <summary>Reextraer con IA</summary>
          {controls}
        </details>
      ) : (
        controls
      )}
      {result && (
        <details open className="elite-ai-result">
          <summary>
            Resultado de la IA · {Object.keys(result.producto).length} campos ·{" "}
            {result.producto.specs?.length || 0} specs ·{" "}
            {Object.values(result.confianza).filter((v) => v === "baja").length} para revisar
          </summary>
          <ul>
            {result.avisos.map((text, i) => (
              <li key={i}>{text}</li>
            ))}
            {Object.entries(result.confianza)
              .filter(([, v]) => v === "baja")
              .map(([key]) => (
                <li key={key}>Revisar {key}: datos dudosos o contradictorios.</li>
              ))}
          </ul>
          {result.posiblesDuplicados.map((p) => (
            <p key={p.id}>
              Ya existe un producto parecido: {p.sku} {p.titulo} ·{" "}
              <Link href={`/admin/productos/${p.id}`}>Abrir el existente</Link>
            </p>
          ))}
          {result.imagenesSugeridas.length > 0 && (
            <p>
              Imágenes sugeridas:{" "}
              {result.imagenesSugeridas.map((url) => (
                <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                  Ver imagen{" "}
                </a>
              ))}
            </p>
          )}
          {previous && (
            <button
              type="button"
              className="elite-button secondary"
              onClick={() => {
                onApply(previous);
                setPrevious(null);
                setResult(null);
              }}
            >
              <Undo2 size={15} />
              Deshacer extracción
            </button>
          )}
        </details>
      )}
      <Dialog.Root open={merge} onOpenChange={setMerge}>
        <Dialog.Portal>
          <Dialog.Overlay className="elite-overlay" />
          <Dialog.Content className="elite-search-dialog">
            <Dialog.Title>Ya hay datos cargados. ¿Qué hacemos?</Dialog.Title>
            <Dialog.Description>
              La extracción se aplica completa cuando termina; no guarda el producto.
            </Dialog.Description>
            <div className="elite-toolbar">
              <button className="elite-button" onClick={() => void run("vacios")}>
                Solo llenar campos vacíos
              </button>
              <button className="elite-button secondary" onClick={() => void run("reemplazar")}>
                Reemplazar lo que trajo la IA
              </button>
              <Dialog.Close className="elite-button secondary">Cancelar</Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
