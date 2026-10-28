import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { cronAuthorized } from "@/lib/cron/auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  if (!cronAuthorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const [counts, popular] = await Promise.all([
      getDb().execute(
        sql`SELECT (SELECT count(*)::int FROM builds WHERE created_at>=now()-interval '7 days') as builds,(SELECT count(*)::int FROM proformas WHERE issued_at>=now()-interval '7 days') as proformas`,
      ),
      getDb().execute(
        sql`SELECT c.category,count(*)::int AS selections FROM build_items bi JOIN components c ON c.id=bi.component_id JOIN builds b ON b.id=bi.build_id WHERE b.created_at>=now()-interval '7 days' GROUP BY c.category ORDER BY selections DESC`,
      ),
    ]);
    return Response.json({ ok: true, counts, popular });
  } catch {
    return Response.json({ error: "Database unavailable" }, { status: 503 });
  }
}
