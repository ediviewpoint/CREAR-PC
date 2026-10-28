import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { sendProformaEmail } from "../send-proforma";

describe("sendProformaEmail", () => {
  const original = {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    RESEND_FROM_NAME: process.env.RESEND_FROM_NAME,
  };

  beforeEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
    delete process.env.RESEND_FROM_NAME;
  });

  afterEach(() => {
    for (const [k, v] of Object.entries(original)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });

  it("degrada a not-configured cuando RESEND_API_KEY está vacío", async () => {
    const result = await sendProformaEmail({
      to: "cliente@ejemplo.bo",
      clientName: "Cliente",
      proformaCode: "PRO-2026-00001",
      proformaUrl: "https://www.ofertas333.com/proforma/00000000-0000-0000-0000-000000000000",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("not-configured");
  });

  it("degrada a not-configured cuando falta RESEND_FROM_EMAIL", async () => {
    process.env.RESEND_API_KEY = "re_test_dummy";
    const result = await sendProformaEmail({
      to: "cliente@ejemplo.bo",
      clientName: "Cliente",
      proformaCode: "PRO-2026-00001",
      proformaUrl: "https://www.ofertas333.com/proforma/00000000-0000-0000-0000-000000000000",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("not-configured");
  });

  it("rechaza con invalid-input cuando el email del cliente es inválido", async () => {
    process.env.RESEND_API_KEY = "re_test_dummy";
    process.env.RESEND_FROM_EMAIL = "proformas@ofertas333.com";
    const result = await sendProformaEmail({
      to: "no-es-un-email",
      clientName: "Cliente",
      proformaCode: "PRO-2026-00001",
      proformaUrl: "https://www.ofertas333.com/proforma/00000000-0000-0000-0000-000000000000",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("invalid-input");
  });

  it("rechaza con invalid-input cuando proformaUrl no es URL válida", async () => {
    process.env.RESEND_API_KEY = "re_test_dummy";
    process.env.RESEND_FROM_EMAIL = "proformas@ofertas333.com";
    const result = await sendProformaEmail({
      to: "cliente@ejemplo.bo",
      clientName: "Cliente",
      proformaCode: "PRO-2026-00001",
      proformaUrl: "no-es-url",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("invalid-input");
  });
});
