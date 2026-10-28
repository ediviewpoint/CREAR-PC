import "server-only";
import { sql } from "drizzle-orm";
import { componentImages } from "@/lib/db/schema";
// Never send stored image bytes as part of the catalog/RSC payload.
export const publicImageUrl = sql<string>`case when ${componentImages.url} like 'data:image/webp;base64,%' then '/api/product-images/' || ${componentImages.id}::text else ${componentImages.url} end`;
