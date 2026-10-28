"use server";
import { headers } from "next/headers";
import { visitorHash } from "@/lib/auth/visitor";
import { issueOwnedQuote } from "@/lib/quote/service";
import { QuoteError } from "@/lib/quote/prepare";
import { issueQuoteInput } from "@/lib/schemas/quote";
import { rateLimit, clientKey } from "@/lib/rate-limit";
export async function generateProformaAction(raw: unknown) {
  const parsed = issueQuoteInput.safeParse(raw);
  if (!parsed.success)
    return { ok: false as const, message: "Revisá los datos del cliente y el descuento." };
  const owner = await visitorHash();
  if (!owner) return { ok: false as const, message: "Guardá tu build antes de emitir." };
  const requestHeaders = await headers();
  if (
    !rateLimit(clientKey(requestHeaders.get("x-forwarded-for"), "issue"), {
      limit: 20,
      windowMs: 3600000,
    }).success
  )
    return { ok: false as const, message: "Alcanzaste el límite de emisiones. Intentá más tarde." };
  try {
    return { ok: true as const, ...(await issueOwnedQuote(parsed.data, owner)) };
  } catch (error) {
    return {
      ok: false as const,
      message:
        error instanceof QuoteError
          ? error.message
          : "No se pudo emitir. Comprobá los datos, guardá nuevamente e intentá otra vez.",
    };
  }
}
