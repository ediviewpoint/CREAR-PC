import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { cronAuthorized } from "@/lib/cron/auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  if (!cronAuthorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const result = await getDb().execute(
      sql`SELECT count(*)::int as total,count(*) FILTER (WHERE valid_until < (now() AT TIME ZONE 'America/La_Paz')::date)::int as expired FROM proformas`,
    );
    return Response.json({ ok: true, stats: result });
  } catch {
    return Response.json({ error: "Database unavailable" }, { status: 503 });
  }
}
