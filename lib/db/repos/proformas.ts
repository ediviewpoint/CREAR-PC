import "server-only";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

type NewProforma = typeof schema.proformas.$inferInsert;

export async function createProforma(input: NewProforma) {
  const [row] = await getDb().insert(schema.proformas).values(input).returning();
  return row;
}

export async function getProformaById(id: string) {
  const [row] = await getDb()
    .select()
    .from(schema.proformas)
    .where(eq(schema.proformas.id, id))
    .limit(1);
  return row ?? null;
}

export async function getProformaByCode(code: string) {
  const [row] = await getDb()
    .select()
    .from(schema.proformas)
    .where(eq(schema.proformas.code, code))
    .limit(1);
  return row ?? null;
}

export async function updateProformaPdfUrl(id: string, pdfBlobUrl: string) {
  await getDb()
    .update(schema.proformas)
    .set({ pdfBlobUrl })
    .where(eq(schema.proformas.id, id));
}
