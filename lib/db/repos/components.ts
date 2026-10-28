import "server-only";
import { eq, inArray } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

export async function getComponentById(id: string) {
  const [row] = await getDb()
    .select()
    .from(schema.components)
    .where(eq(schema.components.id, id))
    .limit(1);
  return row ?? null;
}

export async function getComponentsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  return getDb().select().from(schema.components).where(inArray(schema.components.id, ids));
}

export async function getComponentBySlug(slug: string) {
  const [row] = await getDb()
    .select()
    .from(schema.components)
    .where(eq(schema.components.slug, slug))
    .limit(1);
  return row ?? null;
}

export async function listActiveByCategory(category: typeof schema.components.$inferSelect.category) {
  return getDb()
    .select()
    .from(schema.components)
    .where(eq(schema.components.category, category));
}
