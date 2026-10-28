import "server-only";
import sharp from "sharp";

export const MAX_PHOTO_BYTES = 3 * 1024 * 1024;
export const MAX_STORED_PHOTO_BYTES = 350 * 1024;
export async function prepareProductPhoto(file: File) {
  if (!file.size || file.size > MAX_PHOTO_BYTES)
    throw new Error("La foto debe pesar como máximo 3 MB.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const webp =
    bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP";
  if (!jpeg && !png && !webp)
    throw new Error(
      "Usá una foto JPG, PNG o WebP. El contenido del archivo debe corresponder al formato.",
    );
  try {
    const image = sharp(bytes, { limitInputPixels: 20_000_000, animated: true });
    const meta = await image.metadata();
    if (!meta.width || !meta.height || meta.width < 64 || meta.height < 64 || (meta.pages ?? 1) > 1)
      throw new Error("dimensions");
    const result = await image
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
    if (result.data.length > MAX_STORED_PHOTO_BYTES) throw new Error("weight");
    return {
      url: `data:image/webp;base64,${result.data.toString("base64")}`,
      width: result.info.width,
      height: result.info.height,
    };
  } catch {
    throw new Error(
      "No se pudo procesar la foto. Usá una imagen estática entre 64 px y 20 megapíxeles, preferentemente con fondo blanco.",
    );
  }
}

export function storedPhotoBytes(url: string) {
  const prefix = "data:image/webp;base64,";
  if (!url.startsWith(prefix) || !/^[A-Za-z0-9+/]+=*$/.test(url.slice(prefix.length))) return null;
  const bytes = Buffer.from(url.slice(prefix.length), "base64");
  return bytes.length <= MAX_STORED_PHOTO_BYTES &&
    bytes.subarray(0, 4).toString() === "RIFF" &&
    bytes.subarray(8, 12).toString() === "WEBP"
    ? bytes
    : null;
}
