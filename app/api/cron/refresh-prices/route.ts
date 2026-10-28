import { z } from "zod";
import { sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { cronAuthorized } from "@/lib/cron/auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const feed = z
  .array(
    z.object({
      componentId: z.uuid(),
      storeId: z.uuid(),
      amount: z.number().positive().max(1000000),
      inStock: z.boolean(),
      observedAt: z.iso.datetime(),
      sourceUrl: z.url(),
    }),
  )
  .max(10000);
export async function GET(request: Request) {
  if (!cronAuthorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const url = process.env.PRICE_FEED_URL;
    if (!url) {
      const stats = await getDb().execute(
        sql`SELECT count(*)::int AS observations,count(*) FILTER(WHERE observed_at>=now()-interval '7 days')::int AS recent FROM prices`,
      );
      return Response.json({ ok: true, mode: "manual", updated: 0, stats });
    }
    if (!url.startsWith("https://"))
      return Response.json({ error: "Feed must use HTTPS" }, { status: 503 });
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error("feed");
    const text = await response.text();
    if (text.length > 2_000_000) throw new Error("size");
    const rows = feed.parse(JSON.parse(text));
    const now = Date.now();
    if (
      rows.some(
        (r) =>
          new Date(r.observedAt).getTime() > now ||
          now - new Date(r.observedAt).getTime() > 7 * 86400000,
      )
    )
      throw new Error("date");
    if (rows.length)
      await getDb().transaction(async (tx) => {
        for (const row of rows)
          await tx
            .insert(schema.prices)
            .values({
              ...row,
              amount: row.amount.toFixed(2),
              currency: "BOB",
              observedAt: new Date(row.observedAt),
            });
      });
    return Response.json({ ok: true, mode: "configured-feed", updated: rows.length });
  } catch {
    return Response.json({ error: "No se pudo actualizar el feed o la base." }, { status: 503 });
  }
}
