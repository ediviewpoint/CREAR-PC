import { z } from "zod";
import { storeImageBytes } from "@/lib/uploads";
import { requireSession } from "@/lib/auth";
import { apiError, ApiError, readJson } from "@/lib/api-errors";
import { safeDownload } from "@/lib/safe-download";
export async function POST(request: Request) {
  try {
    await requireSession("EDITOR");
    let bytes: Buffer;
    if (request.headers.get("content-type")?.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File) || file.size > 8 * 1024 * 1024 || !file.size)
        throw new ApiError("ARCHIVO_INVALIDO", "Archivo muy grande; máximo 8 MB", 415);
      bytes = Buffer.from(await file.arrayBuffer());
    } else {
      const { url } = z
        .object({ url: z.url() })
        .strict()
        .parse(await readJson(request));
      bytes = (await safeDownload(url, 8 * 1024 * 1024)).bytes;
    }
    return Response.json(await storeImageBytes(bytes));
  } catch (error) {
    return apiError(error);
  }
}
