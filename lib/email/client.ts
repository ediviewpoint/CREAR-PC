import "server-only";
import { Resend } from "resend";

let cached: Resend | null = null;

/**
 * Devuelve el cliente de Resend si está configurado, o null si no.
 *
 * Diseño opt-in: si no hay `RESEND_API_KEY`, el llamador debe degradar
 * graciosamente (por ejemplo, mantener el flujo de descarga manual del PDF).
 */
export function getEmailClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!cached) cached = new Resend(process.env.RESEND_API_KEY);
  return cached;
}

export function emailFromAddress(): string | null {
  const email = process.env.RESEND_FROM_EMAIL?.trim();
  const name = process.env.RESEND_FROM_NAME?.trim();
  if (!email) return null;
  return name ? `${name} <${email}>` : email;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}
