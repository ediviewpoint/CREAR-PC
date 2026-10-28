"use client";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { proformaSchema } from "@/lib/proforma/types";
import type { ProformaData } from "@/lib/proforma/types";
import { ProformaReadable } from "./ProformaReadable";
const subscribe = (notify: () => void) => {
  window.addEventListener("crearpc:proforma-updated", notify);
  return () => window.removeEventListener("crearpc:proforma-updated", notify);
};
const read = () => {
  try {
    return sessionStorage.getItem("crearpc.proforma.local");
  } catch {
    return null;
  }
};
export function LocalProforma() {
  const raw = useSyncExternalStore(subscribe, read, () => null);
  const parsed = useMemo(() => {
    try {
      return raw ? proformaSchema.safeParse(JSON.parse(raw)) : null;
    } catch {
      return null;
    }
  }, [raw]);
  const data = parsed?.success ? parsed.data : null;
  if (!data)
    return (
      <div className="empty-state">
        <h2>No hay un borrador en esta pestaña.</h2>
        <p>Preparalo desde tu mesa de trabajo.</p>
        <Link className="button" href="/build">
          Volver al build
        </Link>
      </div>
    );
  return <LocalDocument key={raw} data={data} />;
}

function LocalDocument({ data }: { data: ProformaData }) {
  const [pdfUrl, setPdfUrl] = useState("");
  const [error, setError] = useState("");
  const [detailsError, setDetailsError] = useState("");
  useEffect(() => {
    if (!data) return;
    let active = true,
      objectUrl = "";
    async function create() {
      try {
        const [{ pdf }, { ProformaPDF, registerProformaFonts }] = await Promise.all([
          import("@react-pdf/renderer"),
          import("./ProformaPDF"),
        ]);
        registerProformaFonts();
        const url = new URL("/proforma/local", window.location.origin).toString();
        const blob = await pdf(<ProformaPDF data={data} qrDataUrl="" url={url} />).toBlob();
        if (active) {
          objectUrl = URL.createObjectURL(blob);
          setPdfUrl(objectUrl);
        }
      } catch {
        if (active) setError("No se pudo generar el PDF. Volvé a cargar la página.");
      }
    }
    void create();
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [data]);
  return (
    <>
      <p className="muted">
        Este borrador está disponible solo en esta pestaña. Podés descargar el archivo PDF para
        revisión; todavía no es una cotización emitida ni un enlace compartible.
      </p>
      <details className="draft-client-details">
        <summary>Completar datos del cliente</summary>
        <form
          className="draft-client-form"
          onSubmit={(event) => {
            event.preventDefault();
            const fields = new FormData(event.currentTarget);
            const result = proformaSchema.safeParse({
              ...data,
              client: {
                name: String(fields.get("clientName") ?? "").trim(),
                ciNit: String(fields.get("ciNit") ?? "").trim() || undefined,
                phone: String(fields.get("phone") ?? "").trim() || undefined,
              },
            });
            if (!result.success) {
              setDetailsError("Revisá los datos del cliente.");
              return;
            }
            try {
              sessionStorage.setItem("crearpc.proforma.local", JSON.stringify(result.data));
              window.dispatchEvent(new Event("crearpc:proforma-updated"));
            } catch {
              setDetailsError("No se pudo actualizar el borrador en esta pestaña.");
            }
          }}
        >
          <p className="small muted">
            Estos datos aparecerán en el PDF. El documento seguirá marcado como borrador hasta su
            emisión.
          </p>
          <label>
            Nombre del cliente
            <input
              name="clientName"
              required
              maxLength={160}
              defaultValue={data.client.name === "Por completar" ? "" : data.client.name}
              autoComplete="name"
            />
          </label>
          <label>
            CI / NIT (opcional)
            <input name="ciNit" maxLength={40} defaultValue={data.client.ciNit} />
          </label>
          <label>
            Teléfono (opcional)
            <input
              name="phone"
              type="tel"
              maxLength={40}
              defaultValue={data.client.phone}
              autoComplete="tel"
            />
          </label>
          <button className="button" type="submit">
            Actualizar borrador y PDF
          </button>
          {detailsError && <p role="alert">{detailsError}</p>}
        </form>
      </details>
      <div className="proforma-toolbar">
        <Link className="button button--ghost" href="/build">
          Volver al configurador
        </Link>
        <span className="small muted">
          Tu selección se recupera automáticamente al volver en esta pestaña.
        </span>
        {pdfUrl ? (
          <a className="button" href={pdfUrl} download="CREAR-PC-borrador.pdf">
            Descargar PDF ↗
          </a>
        ) : (
          <p role="status">{error || "Preparando PDF…"}</p>
        )}
      </div>
      {pdfUrl && (
        <iframe
          className="proforma-frame"
          src={pdfUrl}
          title="Vista exacta del PDF de tu borrador"
        />
      )}
      <details className="proforma-readable" open>
        <summary>Contenido accesible del borrador</summary>
        <ProformaReadable data={data} url="/proforma/local" />
      </details>
    </>
  );
}
