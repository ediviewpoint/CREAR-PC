import { requireSession } from "@/lib/auth";
import { apiError, ApiError, readJson } from "@/lib/api-errors";
import { extractProduct, ExtractRequest } from "@/lib/ia/extraer";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const session = await requireSession("EDITOR");
    const input = ExtractRequest.parse(await readJson(request));
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(45000)]);
    if (!request.headers.get("accept")?.includes("text/event-stream"))
      return Response.json(await extractProduct(input, session.user, undefined, signal));
    const encoder = new TextEncoder();
    return new Response(
      new ReadableStream({
        async start(controller) {
          const emit = (event: string, data: unknown) => {
            if (!signal.aborted)
              controller.enqueue(
                encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
              );
          };
          try {
            const result = await extractProduct(
              input,
              session.user,
              (stage) => emit("etapa", { texto: stage }),
              signal,
            );
            if (signal.aborted)
              throw new ApiError("IA_TIMEOUT", "La IA tardó demasiado. Intenta de nuevo", 504);
            emit("resultado", result);
          } catch (error) {
            const e =
              error instanceof ApiError
                ? error
                : new ApiError("IA_PROVEEDOR", "No se pudo completar la extracción", 503);
            controller.enqueue(
              encoder.encode(
                `event: error\ndata: ${JSON.stringify({ error: { code: e.code, message: e.message } })}\n\n`,
              ),
            );
          } finally {
            controller.close();
          }
        },
      }),
      {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          "X-Accel-Buffering": "no",
        },
      },
    );
  } catch (error) {
    return apiError(error);
  }
}
