import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { z } from "zod";
type Executor = Pick<ReturnType<typeof getDb>, "execute">;
export function counterValue(result: unknown): number {
  const raw = Array.isArray(result)
    ? result
    : typeof result === "object" && result !== null && "rows" in result
      ? result.rows
      : null;
  const parsed = z
    .array(z.object({ seq: z.coerce.number().int().min(1).max(99999) }))
    .min(1)
    .parse(raw);
  return parsed[0]!.seq;
}
export async function nextProformaCode(now = new Date(), executor: Executor = getDb()) {
  const year = Number(
    new Intl.DateTimeFormat("en", { year: "numeric", timeZone: "America/La_Paz" }).format(now),
  );
  const result = await executor.execute(
    sql`INSERT INTO proforma_counters(year,next_val) VALUES(${year},2) ON CONFLICT(year) DO UPDATE SET next_val=proforma_counters.next_val+1 RETURNING next_val-1 AS seq`,
  );
  return `PRO-${year}-${String(counterValue(result)).padStart(5, "0")}`;
}
