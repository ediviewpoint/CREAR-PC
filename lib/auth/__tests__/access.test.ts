import { beforeEach, describe, it, expect, vi } from "vitest";
const context = vi.hoisted(() => ({ role: "" }));
vi.mock("@/lib/auth", () => ({
  auth: async () => (context.role ? { user: { rol: context.role } } : null),
}));
import { isAdmin } from "../admin";
import { cronAuthorized } from "@/lib/cron/auth";
beforeEach(() => {
  context.role = "";
  vi.stubEnv("CRON_SECRET", "fixture-cron-secret");
});
describe("Acceso administrativo heredado", () => {
  it("exige sesión Auth.js ADMIN incluso con contraseña global configurada", async () => {
    vi.stubEnv("ADMIN_PASSWORD", "fixture-only-secret");
    expect(await isAdmin()).toBe(false);
    for (const role of ["LECTOR", "VENDEDOR", "EDITOR"]) {
      context.role = role;
      expect(await isAdmin()).toBe(false);
    }
    context.role = "ADMIN";
    expect(await isAdmin()).toBe(true);
  });
  it("cron no admite secreto ausente ni distinto", () => {
    expect(cronAuthorized(new Request("https://fixture.invalid"))).toBe(false);
    expect(
      cronAuthorized(
        new Request("https://fixture.invalid", {
          headers: { authorization: "Bearer fixture-cron-secret" },
        }),
      ),
    ).toBe(true);
    vi.stubEnv("CRON_SECRET", "");
    expect(cronAuthorized(new Request("https://fixture.invalid"))).toBe(false);
  });
});
