import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { isAdmin } from "@/lib/auth/admin";
import { storedPhotoBytes } from "@/lib/admin/product-images";
export const runtime = "nodejs";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return new Response(null, { status: 404 });
  try {
    const [image] = await getDb()
      .select({ url: schema.componentImages.url, active: schema.components.isActive })
      .from(schema.componentImages)
      .innerJoin(schema.components, eq(schema.components.id, schema.componentImages.componentId))
      .where(eq(schema.componentImages.id, id));
    if (!image || (!image.active && !(await isAdmin()))) return new Response(null, { status: 404 });
    const bytes = storedPhotoBytes(image.url);
    if (!bytes) return new Response(null, { status: 404 });
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "image/webp",
        "Content-Length": String(bytes.length),
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": image.active ? "public, max-age=300" : "private, no-store",
      },
    });
  } catch {
    return new Response(null, { status: 503, headers: { "Retry-After": "30" } });
  }
}
