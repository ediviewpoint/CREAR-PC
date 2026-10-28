import { z } from "zod";

/**
 * Datos del responsable legal del sitio (ELITEPC).
 *
 * Si estas variables de entorno no están definidas, los componentes
 * que las usen deben degradar graciosamente (ej. ocultar botón contacto,
 * omitir sección NIT en PDF). NUNCA inventar valores por defecto.
 *
 * Pendientes al 2026-10-28 (ver docs/REVISION-DISENO-Y-POLITICAS.md §Datos pendientes):
 *   - Identidad legal del responsable (razón social + NIT).
 *   - Canal real de contacto/reclamos.
 */

const emailSchema = z.string().email();
const phoneSchema = z.string().regex(/^\+?[\d\s\-()]{6,20}$/);

export type VendorIdentity = {
  tradeName: string;
  legalName: string | null;
  nit: string | null;
  address: string | null;
  city: string;
  contactEmail: string | null;
  supportWhatsapp: string | null;
};

function readOpt(name: string, parser: z.ZodType): string | null {
  const raw = process.env[name]?.trim();
  if (!raw) return null;
  const result = parser.safeParse(raw);
  return result.success ? raw : null;
}

export function getVendorIdentity(): VendorIdentity {
  return {
    tradeName: "ELITEPC",
    legalName: process.env.LEGAL_RESPONSIBLE?.trim() || null,
    nit: process.env.LEGAL_NIT?.trim() || null,
    address: process.env.LEGAL_ADDRESS?.trim() || null,
    city: process.env.LEGAL_CITY?.trim() || "Santa Cruz de la Sierra, Bolivia",
    contactEmail: readOpt("NEXT_PUBLIC_CONTACT_EMAIL", emailSchema),
    supportWhatsapp: readOpt("NEXT_PUBLIC_SUPPORT_WHATSAPP", phoneSchema),
  };
}

export function isVendorFullyConfigured(id: VendorIdentity = getVendorIdentity()): boolean {
  return Boolean(id.legalName && id.nit && id.contactEmail);
}

export function missingVendorFields(id: VendorIdentity = getVendorIdentity()): string[] {
  const missing: string[] = [];
  if (!id.legalName) missing.push("razón social (LEGAL_RESPONSIBLE)");
  if (!id.nit) missing.push("NIT (LEGAL_NIT)");
  if (!id.contactEmail) missing.push("email de contacto (NEXT_PUBLIC_CONTACT_EMAIL)");
  if (!id.address) missing.push("dirección física (LEGAL_ADDRESS)");
  if (!id.supportWhatsapp) missing.push("WhatsApp de soporte (NEXT_PUBLIC_SUPPORT_WHATSAPP)");
  return missing;
}
