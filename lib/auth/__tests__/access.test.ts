import { beforeEach, describe, it, expect, vi } from "vitest";
const context = vi.hoisted(() => ({ jar: new Map<string, string>() }));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (k: string) => (context.jar.has(k) ? { value: context.jar.get(k) } : undefined),
    set: (k: string, v: string) => context.jar.set(k, v),
    delete: (k: string) => context.jar.delete(k),
  }),
}));
import { isAdmin, passwordMatches, startAdminSession, endAdminSession } from "../admin";
import { cronAuthorized } from "@/lib/cron/auth";
beforeEach(() => {
  context.jar.clear();
  vi.stubEnv("ADMIN_PASSWORD", "fixture-admin-password-only");
  vi.stubEnv("CRON_SECRET", "fixture-cron-secret");
});
describe("Acceso administrativo y cron", () => {
  it("verifica contraseña y sesión firmada", async () => {
    expect(passwordMatches("incorrecta")).toBe(false);
    expect(passwordMatches("fixture-admin-password-only")).toBe(true);
    expect(await isAdmin()).toBe(false);
    await startAdminSession();
    expect(await isAdmin()).toBe(true);
    await endAdminSession();
    expect(await isAdmin()).toBe(false);
  });
  it("rechaza cookies malformadas sin lanzar errores", async () => {
    for (const v of ["bad", "NaN." + "a".repeat(64), "1770000000000." + "é".repeat(64)]) {
      context.jar.set("crearpc.admin", v);
      expect(await isAdmin()).toBe(false);
    }
  });
  it("admin sin configuración nunca permite ingreso", async () => {
    vi.stubEnv("ADMIN_PASSWORD", "");
    expect(passwordMatches("")).toBe(false);
    expect(await isAdmin()).toBe(false);
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
