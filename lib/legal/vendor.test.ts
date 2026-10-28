import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  getVendorIdentity,
  isVendorFullyConfigured,
  missingVendorFields,
} from "./vendor";

const ENV_KEYS = [
  "LEGAL_RESPONSIBLE",
  "LEGAL_NIT",
  "LEGAL_ADDRESS",
  "LEGAL_CITY",
  "NEXT_PUBLIC_CONTACT_EMAIL",
  "NEXT_PUBLIC_SUPPORT_WHATSAPP",
] as const;

let snapshot: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>>;

beforeEach(() => {
  snapshot = {};
  for (const k of ENV_KEYS) {
    snapshot[k] = process.env[k];
    delete process.env[k];
  }
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (snapshot[k] === undefined) delete process.env[k];
    else process.env[k] = snapshot[k];
  }
});

describe("getVendorIdentity", () => {
  it("devuelve ELITEPC como trade name siempre", () => {
    expect(getVendorIdentity().tradeName).toBe("ELITEPC");
  });

  it("campos legales son null cuando no hay env", () => {
    const id = getVendorIdentity();
    expect(id.legalName).toBeNull();
    expect(id.nit).toBeNull();
    expect(id.address).toBeNull();
    expect(id.contactEmail).toBeNull();
    expect(id.supportWhatsapp).toBeNull();
  });

  it("ciudad default Santa Cruz si no se setea LEGAL_CITY", () => {
    expect(getVendorIdentity().city).toContain("Santa Cruz");
  });

  it("respeta valores de env válidos", () => {
    process.env.LEGAL_RESPONSIBLE = "ELITEPC S.R.L.";
    process.env.LEGAL_NIT = "123456789";
    process.env.NEXT_PUBLIC_CONTACT_EMAIL = "soporte@example.com";
    process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP = "+59177712345";
    const id = getVendorIdentity();
    expect(id.legalName).toBe("ELITEPC S.R.L.");
    expect(id.nit).toBe("123456789");
    expect(id.contactEmail).toBe("soporte@example.com");
    expect(id.supportWhatsapp).toBe("+59177712345");
  });

  it("rechaza email inválido (queda null)", () => {
    process.env.NEXT_PUBLIC_CONTACT_EMAIL = "no-es-email";
    expect(getVendorIdentity().contactEmail).toBeNull();
  });

  it("rechaza teléfono con caracteres raros", () => {
    process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP = "???";
    expect(getVendorIdentity().supportWhatsapp).toBeNull();
  });
});

describe("isVendorFullyConfigured", () => {
  it("false cuando faltan datos clave", () => {
    expect(isVendorFullyConfigured()).toBe(false);
  });

  it("true cuando los 3 clave están definidos", () => {
    process.env.LEGAL_RESPONSIBLE = "ELITEPC S.R.L.";
    process.env.LEGAL_NIT = "123456789";
    process.env.NEXT_PUBLIC_CONTACT_EMAIL = "hola@example.com";
    expect(isVendorFullyConfigured()).toBe(true);
  });
});

describe("missingVendorFields", () => {
  it("lista los 5 campos cuando está vacío", () => {
    expect(missingVendorFields()).toHaveLength(5);
  });

  it("lista solo lo que falta", () => {
    process.env.LEGAL_RESPONSIBLE = "ELITEPC S.R.L.";
    process.env.NEXT_PUBLIC_CONTACT_EMAIL = "hola@example.com";
    const missing = missingVendorFields();
    expect(missing.some((m) => m.includes("razón social"))).toBe(false);
    expect(missing.some((m) => m.includes("NIT"))).toBe(true);
  });
});
