import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb, schema } from "@/lib/db";

type NewBuild = typeof schema.builds.$inferInsert;
type NewBuildItem = typeof schema.buildItems.$inferInsert;

export async function createEmptyBuild(input: {
  name: string;
  purpose?: NewBuild["purpose"];
  budgetBob?: number;
  isPublic?: boolean;
  userId?: string;
}) {
  const [row] = await getDb()
    .insert(schema.builds)
    .values({
      name: input.name,
      purpose: input.purpose,
      budgetBob: input.budgetBob?.toString(),
      isPublic: input.isPublic ?? false,
      shareSlug: nanoid(12),
      userId: input.userId,
      totalBob: "0",
    })
    .returning();
  return row;
}

export async function getBuildById(id: string) {
  const [row] = await getDb().select().from(schema.builds).where(eq(schema.builds.id, id)).limit(1);
  return row ?? null;
}

export async function getBuildByShareSlug(slug: string) {
  const [row] = await getDb()
    .select()
    .from(schema.builds)
    .where(eq(schema.builds.shareSlug, slug))
    .limit(1);
  return row ?? null;
}

export async function getBuildWithItems(id: string) {
  const build = await getBuildById(id);
  if (!build) return null;
  const items = await getDb()
    .select()
    .from(schema.buildItems)
    .where(eq(schema.buildItems.buildId, id))
    .orderBy(schema.buildItems.sortOrder, schema.buildItems.id);
  const componentIds = items.map((i) => i.componentId);
  const components =
    componentIds.length > 0
      ? await getDb()
          .select()
          .from(schema.components)
          .where(inArray(schema.components.id, componentIds))
      : [];
  return { build, items, components };
}

export async function addBuildItem(item: NewBuildItem) {
  const [row] = await getDb().insert(schema.buildItems).values(item).returning();
  return row;
}

export async function removeBuildItem(buildId: string, buildItemId: string) {
  await getDb()
    .delete(schema.buildItems)
    .where(and(eq(schema.buildItems.buildId, buildId), eq(schema.buildItems.id, buildItemId)));
}

export async function updateBuildTotal(id: string, totalBob: number, compatReport: unknown) {
  await getDb()
    .update(schema.builds)
    .set({
      totalBob: totalBob.toFixed(2),
      compatReport: compatReport as Record<string, unknown>,
      updatedAt: new Date(),
    })
    .where(eq(schema.builds.id, id));
}
