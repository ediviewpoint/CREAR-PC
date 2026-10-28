"use server";
import { revalidatePath } from "next/cache";
import { visitorHash } from "@/lib/auth/visitor";
import { saveOwnedBuild } from "@/lib/quote/service";
import { QuoteError } from "@/lib/quote/prepare";
import { quoteBuildInput } from "@/lib/schemas/quote";
export async function saveBuildForQuoteAction(raw: unknown) {
  const input = quoteBuildInput.safeParse(raw);
  if (!input.success)
    return { ok: false as const, message: "Revisá las piezas y cantidades del build." };
  try {
    const result = await saveOwnedBuild(input.data, (await visitorHash(true))!);
    revalidatePath("/build/" + result.buildId);
    return { ok: true as const, ...result };
  } catch (error) {
    return {
      ok: false as const,
      message:
        error instanceof QuoteError
          ? error.message
          : "No se pudo guardar. Verificá la conexión de la base y volvé a intentar.",
    };
  }
}
