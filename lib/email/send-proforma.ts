import "server-only";
import { z } from "zod";
import { getEmailClient, emailFromAddress } from "./client";

const inputSchema = z.object({
  to: z.email(),
  clientName: z.string().trim().min(1).max(160),
  proformaCode: z.string().trim().min(1).max(32),
  proformaUrl: z.url(),
  pdfBuffer: z.instanceof(Buffer).optional(),
});

export type SendProformaInput = z.infer<typeof inputSchema>;

export type SendProformaResult =
  | { ok: true; id: string }
  | { ok: false; reason: "not-configured" | "invalid-input" | "provider-error"; detail?: string };

/**
 * Envía la proforma por email al cliente usando Resend.
 *
 * Degrada graciosamente:
 *   - Si Resend no está configurado: devuelve { ok: false, reason: 'not-configured' }.
 *     El llamador debe mantener la opción de descarga manual del PDF.
 *   - Si falla el provider: no lanza, devuelve { ok: false, reason: 'provider-error' }.
 *
 * El llamador decide si registra el intento, muestra UI de error, etc.
 */
export async function sendProformaEmail(input: SendProformaInput): Promise<SendProformaResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid-input", detail: parsed.error.message };

  const client = getEmailClient();
  const from = emailFromAddress();
  if (!client || !from) return { ok: false, reason: "not-configured" };

  const { to, clientName, proformaCode, proformaUrl, pdfBuffer } = parsed.data;

  try {
    const result = await client.emails.send({
      from,
      to,
      subject: `Proforma ${proformaCode} — ELITEPC`,
      text: [
        `Hola ${clientName},`,
        "",
        `Adjuntamos tu proforma ${proformaCode}.`,
        `Podés verla en línea: ${proformaUrl}`,
        "",
        "Este documento no es factura y no habilita crédito fiscal.",
        "Validez según se indique en el PDF.",
        "",
        "— ELITEPC",
      ].join("\n"),
      attachments: pdfBuffer
        ? [{ filename: `proforma-${proformaCode}.pdf`, content: pdfBuffer }]
        : undefined,
    });

    if (result.error) {
      return { ok: false, reason: "provider-error", detail: result.error.message };
    }
    return { ok: true, id: result.data?.id ?? "" };
  } catch (err) {
    return {
      ok: false,
      reason: "provider-error",
      detail: err instanceof Error ? err.message : "error desconocido",
    };
  }
}
