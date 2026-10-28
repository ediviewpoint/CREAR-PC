"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { saveBuildForQuoteAction } from "@/app/_actions/build";
import { generateProformaAction } from "@/app/_actions/proforma";
import type { QuoteBuildInput } from "@/lib/schemas/quote";
export function QuoteDialog({
  build,
  disabled,
  onSaved,
}: {
  build: QuoteBuildInput;
  disabled: boolean;
  onSaved: (id: string) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    key = useRef("");
  const inFlight = useRef(false);
  const [pending, start] = useTransition(),
    [message, setMessage] = useState("");
  const router = useRouter();
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    const form = new FormData(event.currentTarget);
    start(async () => {
      setMessage("");
      try {
        const saved = await saveBuildForQuoteAction(build);
        if (!saved.ok) {
          setMessage(saved.message);
          return;
        }
        onSaved(saved.buildId);
        key.current ||= crypto.randomUUID();
        const result = await generateProformaAction({
          buildId: saved.buildId,
          requestKey: key.current,
          client: {
            name: String(form.get("name") ?? ""),
            ciNit: String(form.get("ciNit") ?? ""),
            phone: String(form.get("phone") ?? ""),
            email: String(form.get("email") ?? ""),
          },
          discountBob: Number(form.get("discount") ?? 0),
          validityDays: Number(form.get("days") ?? 7),
          isPublic: form.get("public") === "on",
        });
        if (!result.ok) {
          setMessage(result.message);
          return;
        }
        router.push(`/proforma/${result.id}`);
      } catch {
        setMessage(
          "No se pudo completar la emisión. Tus datos siguen en el formulario; volvé a intentar.",
        );
      } finally {
        inFlight.current = false;
      }
    });
  }
  return (
    <>
      <button
        className="button"
        type="button"
        disabled={disabled || pending}
        onClick={() => {
          key.current = "";
          setMessage("");
          ref.current?.showModal();
        }}
      >
        Generar proforma ↗
      </button>
      <dialog className="zoom-dialog quote-dialog" ref={ref} aria-labelledby="quote-title">
        <form onSubmit={submit} aria-busy={pending}>
          <h2 id="quote-title">Datos para tu proforma.</h2>
          <p className="muted small">
            La emisión guarda los importes y condiciones de esta cotización.
          </p>
          <fieldset disabled={pending}>
            <label>
              Nombre del cliente
              <input name="name" required maxLength={160} autoComplete="name" />
            </label>
            <label>
              CI / NIT (opcional)
              <input name="ciNit" maxLength={40} />
            </label>
            <label>
              Teléfono (opcional)
              <input name="phone" type="tel" maxLength={40} autoComplete="tel" />
            </label>
            <label>
              Email (opcional)
              <input name="email" type="email" maxLength={160} autoComplete="email" />
            </label>
            <label>
              Descuento Bs.
              <input name="discount" type="number" min="0" step="0.01" defaultValue="0" />
            </label>
            <label>
              Validez en días
              <input name="days" type="number" min="2" max="30" defaultValue="7" />
            </label>
            <label className="check-label">
              <input name="public" type="checkbox" />
              Permitir enlace público de esta proforma. Incluye los datos del cliente y su imagen al
              compartir.
            </label>
            <p className="small">
              <Link href="/politicas/privacidad" target="_blank">
                Cómo usamos estos datos ↗
              </Link>
            </p>
            <div className="proforma-toolbar">
              <button className="button" type="submit">
                {pending ? "Emitiendo…" : "Emitir proforma"}
              </button>
              <button
                className="button button--ghost"
                type="button"
                onClick={() => ref.current?.close()}
              >
                Cancelar
              </button>
            </div>
          </fieldset>
          {message && <p role="alert">{message}</p>}
        </form>
      </dialog>
    </>
  );
}
