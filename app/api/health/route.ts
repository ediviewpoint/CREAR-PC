import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { getVendorIdentity, missingVendorFields } from "@/lib/legal/vendor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Health = {
  ok: boolean;
  version: string;
  env: string;
  checks: Record<string, { ok: boolean; detail?: string }>;
  vendor: {
    tradeName: string;
    configured: boolean;
    missing: string[];
  };
};

export async function GET() {
  const checks: Health["checks"] = {};

  // 1) DB — intento 1 query trivial
  try {
    await getDb().execute(sql`SELECT 1`);
    checks.database = { ok: true };
  } catch (err) {
    checks.database = {
      ok: false,
      detail: err instanceof Error ? err.message.slice(0, 160) : "connection failed",
    };
  }

  // 2) Env críticas presentes (sin exponer valores)
  const required = ["DATABASE_URL", "NEXT_PUBLIC_SITE_URL"];
  const missingEnv = required.filter((k) => !process.env[k]);
  checks.environment = {
    ok: missingEnv.length === 0,
    detail: missingEnv.length ? `faltan: ${missingEnv.join(", ")}` : undefined,
  };

  const vendor = getVendorIdentity();
  const missing = missingVendorFields(vendor);

  const health: Health = {
    ok: Object.values(checks).every((c) => c.ok),
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
    env: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
    checks,
    vendor: {
      tradeName: vendor.tradeName,
      configured: missing.length === 0,
      missing,
    },
  };

  return NextResponse.json(health, {
    status: health.ok ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
