/**
 * Sanitización mínima server-side de inputs libres (notas de tiendista,
 * nombres de build, etc.). Para HTML enriquecido se agregaría DOMPurify.
 */

const CONTROL_CHARS = /[\x00-\x1f\x7f]/g;

export function sanitizeText(input: string, maxLen = 500): string {
  return input
    .normalize("NFKC")
    .replace(CONTROL_CHARS, "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, maxLen);
}

export function sanitizePhoneBO(input: string): string {
  const cleaned = input.replace(/[^\d+]/g, "");
  if (!cleaned) return "";
  if (cleaned.startsWith("+")) return cleaned.slice(0, 20);
  if (cleaned.startsWith("591") && cleaned.length >= 11) return `+${cleaned.slice(0, 20)}`;
  if (cleaned.length === 8) return `+591${cleaned}`;
  return cleaned.slice(0, 20);
}

export function sanitizeNit(input: string): string {
  return input.replace(/[^0-9A-Za-z-]/g, "").slice(0, 20);
}
