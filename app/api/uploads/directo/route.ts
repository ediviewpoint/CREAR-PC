import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { requireSession } from "@/lib/auth";
import { apiError, ApiError } from "@/lib/api-errors";
export async function POST(request: Request) {
  try {
    await requireSession("EDITOR");
    const body = (await request.json()) as HandleUploadBody;
    return Response.json(
      await handleUpload({
        body,
        request,
        onBeforeGenerateToken: async (pathname) => {
          if (!/^temporales\/[a-zA-Z0-9-]+$/.test(pathname))
            throw new ApiError("ARCHIVO_INVALIDO", "Nombre de archivo inválido", 415);
          return {
            allowedContentTypes: [
              "image/jpeg",
              "image/png",
              "image/webp",
              "image/gif",
              "image/heic",
              "image/heif",
            ],
            maximumSizeInBytes: 8 * 1024 * 1024,
            addRandomSuffix: true,
          };
        },
      }),
    );
  } catch (error) {
    return apiError(error);
  }
}
