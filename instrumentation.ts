/**
 * Instrumentación de Next.js — se carga una vez al bootear.
 *
 * Sentry es opt-in: si `SENTRY_DSN` está vacío, no se inicializa y no hay overhead.
 * Documentación: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 */

export async function register() {
  if (!process.env.SENTRY_DSN) return;
  if (process.env.NEXT_RUNTIME === "nodejs") await import("./sentry.server.config");
  if (process.env.NEXT_RUNTIME === "edge") await import("./sentry.edge.config");
}

import type { captureRequestError as CaptureRequestError } from "@sentry/nextjs";

export const onRequestError = async (...args: Parameters<typeof CaptureRequestError>) => {
  if (!process.env.SENTRY_DSN) return;
  const { captureRequestError } = await import("@sentry/nextjs");
  return captureRequestError(...args);
};
