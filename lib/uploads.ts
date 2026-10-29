import "server-only";
import sharp from "sharp";
import { put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { ApiError } from "@/lib/api-errors";
import { safeDownload } from "@/lib/safe-download";
export async function storeImageBytes(bytes: Buffer) {
  const meta = await sharp(bytes, { limitInputPixels: 40_000_000 })
    .metadata()
    .catch(() => null);
  if (
    !meta ||
    !meta.width ||
    !meta.height ||
    !["jpeg", "png", "webp", "gif", "heif"].includes(meta.format || "")
  )
    throw new ApiError("ARCHIVO_INVALIDO", "Formato no soportado", 415);
  if (!process.env.BLOB_READ_WRITE_TOKEN)
    throw new ApiError(
      "UPLOAD_NO_CONFIGURADO",
      "Falta configurar el almacenamiento de imágenes",
      503,
    );
  const image = sharp(bytes, { limitInputPixels: 40_000_000 }).rotate();
  const id = randomUUID();
  const [large, small] = await Promise.all([
    image
      .clone()
      .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer({ resolveWithObject: true }),
    image
      .clone()
      .resize({ width: 300, height: 300, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer(),
  ]);
  const [full, thumb] = await Promise.all([
    put(`productos/${id}.webp`, large.data, { access: "public", contentType: "image/webp" }),
    put(`productos/${id}-mini.webp`, small, { access: "public", contentType: "image/webp" }),
  ]);
  return {
    url: full.url,
    urlMiniatura: thumb.url,
    ancho: large.info.width,
    alto: large.info.height,
    alt: null,
  };
}
export async function storeImageUrl(url: string) {
  return storeImageBytes((await safeDownload(url, 8 * 1024 * 1024)).bytes);
}
