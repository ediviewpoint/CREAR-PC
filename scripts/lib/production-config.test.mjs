import { test } from "node:test";
import assert from "node:assert/strict";
import { inspectProductionConfig } from "./production-config.mjs";

const configured = {
  DATABASE_URL: "postgresql://operator:private-value@db.shop.bo:5432/catalog",
  ADMIN_PASSWORD: "private-admin-value-123456",
  NEXT_PUBLIC_SITE_URL: "https://pc.shop.bo",
  LEGAL_RESPONSIBLE: "Negocio verificado",
  LEGAL_NIT: "123456789",
  LEGAL_ADDRESS: "Dirección verificada",
  LEGAL_CITY: "Santa Cruz",
  NEXT_PUBLIC_CONTACT_EMAIL: "contacto@shop.bo",
  NEXT_PUBLIC_SUPPORT_WHATSAPP: "+59171234567",
  CRON_SECRET: "private-cron-value-with-more-than-32-characters",
};
test("reports missing configuration without leaking secrets", () => {
  assert.equal(inspectProductionConfig({}).configurationReady, false);
  const report = inspectProductionConfig(configured);
  assert.equal(report.configurationReady, true);
  assert.equal(report.databaseTarget, "remote");
  for (const value of Object.values(configured))
    assert.equal(JSON.stringify(report).includes(value), false);
});
test("rejects local review settings and sample credentials", () => {
  const report = inspectProductionConfig({
    ...configured,
    DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:55432/postgres",
    ADMIN_PASSWORD: "local-admin-review-only-2026",
    NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    NEXT_PUBLIC_SUPPORT_WHATSAPP: "+591-00000000",
  });
  assert.equal(report.databaseTarget, "local");
  for (const name of [
    "DATABASE_URL",
    "ADMIN_PASSWORD",
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_SUPPORT_WHATSAPP",
  ])
    assert.equal(report.checks.find((item) => item.name === name).status, "pending");
});
test("rejects malformed contact and a site URL containing credentials or routes", () => {
  for (const url of [
    "https://user:secret@pc.shop.bo",
    "https://pc.shop.bo/build",
    "https://pc.shop.bo?secret=value",
    "https://[::1]",
  ])
    assert.equal(
      inspectProductionConfig({ ...configured, NEXT_PUBLIC_SITE_URL: url }).configurationReady,
      false,
    );
  assert.equal(
    inspectProductionConfig({ ...configured, NEXT_PUBLIC_CONTACT_EMAIL: "incorrecto" })
      .configurationReady,
    false,
  );
});
