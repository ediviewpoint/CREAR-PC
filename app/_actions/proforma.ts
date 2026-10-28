"use server";
import { headers } from "next/headers";
import { visitorHash } from "@/lib/auth/visitor";
import { issueOwnedQuote } from "@/lib/quote/service";
import { QuoteError } from "@/lib/quote/prepare";
import { issueQuoteInput } from "@/lib/schemas/quote";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { proformaUrl } from "@/lib/proforma/load";
import { sendProformaEmail } from "@/lib/email/send-proforma";

export type EmailStatus =
  | "sent"
  | "skipped-duplicate"
  | "skipped-no-email"
  | "skipped-no-config"
  | "failed";

export type GenerateProformaResult =
  | {
      ok: true;
      id: string;
      code: string;
      created: boolean;
      emailStatus: EmailStatus;
    }
  | { ok: false; message: string };

export async function generateProformaAction(raw: unknown): Promise<GenerateProformaResult> {
  const parsed = issueQuoteInput.safeParse(raw);
  if (!parsed.success)
    return { ok: false, message: "Revisá los datos del cliente y el descuento." };
  const owner = await visitorHash();
  if (!owner) return { ok: false, message: "Guardá tu build antes de emitir." };
  const requestHeaders = await headers();
  if (
    !rateLimit(clientKey(requestHeaders.get("x-forwarded-for"), "issue"), {
      limit: 20,
      windowMs: 3600000,
    }).success
  )
    return { ok: false, message: "Alcanzaste el límite de emisiones. Intentá más tarde." };

  let issued: Awaited<ReturnType<typeof issueOwnedQuote>>;
  try {
    issued = await issueOwnedQuote(parsed.data, owner);
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof QuoteError
          ? error.message
          : "No se pudo emitir. Comprobá los datos, guardá nuevamente e intentá otra vez.",
    };
  }

  const emailStatus = await deliverProformaEmail(issued, parsed.data);
  return { ok: true, id: issued.id, code: issued.code, created: issued.created, emailStatus };
}

async function deliverProformaEmail(
  issued: Awaited<ReturnType<typeof issueOwnedQuote>>,
  input: ReturnType<typeof issueQuoteInput.parse>,
): Promise<EmailStatus> {
  // Idempotencia: no reenviar email si la proforma ya existía (misma requestKey).
  if (!issued.created) return "skipped-duplicate";
  const email = input.client.email?.trim();
  if (!email) return "skipped-no-email";
  try {
    const result = await Promise.race([
      sendProformaEmail({
        to: email,
        clientName: input.client.name,
        proformaCode: issued.code,
        proformaUrl: proformaUrl(issued.id),
      }),
      new Promise<{ ok: false; reason: "failed" }>((resolve) =>
        setTimeout(() => resolve({ ok: false, reason: "failed" }), 10_000),
      ),
    ]);
    if (result.ok) return "sent";
    if (result.reason === "not-configured") return "skipped-no-config";
    return "failed";
  } catch {
    return "failed";
  }
}
