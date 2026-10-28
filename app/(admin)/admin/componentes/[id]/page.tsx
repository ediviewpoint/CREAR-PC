import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { publicImageUrl } from "@/lib/catalog/image-reference";
import { ProductEditor } from "@/components/admin/ProductEditor";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_SCHEMAS,
  getSpecFields,
  type ProductCategory,
} from "@/lib/admin/component-fields";
import { workedBrands } from "@/lib/brand-showcase";
import { getProductCommerce } from "@/lib/admin/products";
export const metadata = { title: "Editar producto" };
export const maxDuration = 120;
export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const db = getDb();
  const [row] = await db.select().from(schema.components).where(eq(schema.components.id, id));
  if (!row || !(row.category in PRODUCT_SCHEMAS)) notFound();
  const commerce = await getProductCommerce(id);
  const photos = await db
    .select({
      id: schema.componentImages.id,
      url: publicImageUrl,
      alt: schema.componentImages.altEs,
      isPrimary: schema.componentImages.isPrimary,
      sortOrder: schema.componentImages.sortOrder,
    })
    .from(schema.componentImages)
    .where(eq(schema.componentImages.componentId, id));
  const photo = photos.sort(
    (a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.sortOrder - b.sortOrder,
  )[0];
  const fieldSets = Object.fromEntries(
    PRODUCT_CATEGORIES.map((category) => [category.key, getSpecFields(category.key)]),
  ) as Record<ProductCategory, ReturnType<typeof getSpecFields>>;
  return (
    <section>
      <Link className="text-link" href="/admin/componentes">
        ← Productos
      </Link>
      <p className="eyebrow">Catálogo / {row.isActive ? "Publicado" : "Borrador"}</p>
      <h1>Editar producto.</h1>
      <p className="page-intro">Los cambios de ficha no modifican los documentos ya emitidos.</p>
      <ProductEditor
        aiConfigured={Boolean(process.env.ANTHROPIC_API_KEY)}
        commerce={commerce}
        key={row.id}
        initial={{
          id: row.id,
          name: row.nameDisplay,
          brand: row.brand,
          slug: row.slug,
          category: row.category as ProductCategory,
          source: row.sources[0]?.url ?? "",
          tdpW: row.tdpW,
          warrantyMonths: row.warrantyMonths,
          spec: row.spec,
          isActive: row.isActive,
          version: row.updatedAt.toISOString(),
          photoUrl: photo?.url,
          photoAlt: photo?.alt,
          photos: photos
            .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.sortOrder - b.sortOrder)
            .map((item) => ({
              id: item.id,
              url: item.url,
              alt: item.alt,
              isPrimary: item.isPrimary,
            })),
        }}
        categories={PRODUCT_CATEGORIES}
        fieldSets={fieldSets}
        brands={workedBrands.map((brand) => brand.name)}
      />
    </section>
  );
}
