import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { publicImageUrl } from "@/lib/catalog/image-reference";
import { selectCurrentOffers } from "@/lib/catalog/offers";
import { PRODUCT_CATEGORIES } from "@/lib/admin/component-fields";
import { ProductList } from "./ProductList";

async function loadProductData() {
  const db = getDb();
  const [products, images, prices, stores] = await Promise.all([
    db.select().from(schema.components).orderBy(desc(schema.components.updatedAt)),
    db
      .select({
        componentId: schema.componentImages.componentId,
        url: publicImageUrl,
        isPrimary: schema.componentImages.isPrimary,
        sortOrder: schema.componentImages.sortOrder,
      })
      .from(schema.componentImages),
    db.select().from(schema.prices),
    db
      .select({ id: schema.stores.id, isOwn: schema.stores.isOwn })
      .from(schema.stores)
      .where(eq(schema.stores.isActive, true)),
  ]);
  const offers = selectCurrentOffers(
    prices,
    new Set(stores.map((row) => row.id)),
    new Date(),
    new Set(stores.filter((row) => row.isOwn).map((row) => row.id)),
  );
  return products.map((row) => {
    const photo = images
      .filter((image) => image.componentId === row.id)
      .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.sortOrder - b.sortOrder)[0];
    const amounts = offers
      .filter((offer) => offer.componentId === row.id)
      .map((offer) => Number(offer.amount));
    return {
      id: row.id,
      name: row.nameDisplay,
      slug: row.slug,
      brand: row.brand,
      category: row.category.startsWith("cooler_") ? "cooler" : row.category,
      categoryLabel:
        PRODUCT_CATEGORIES.find((category) => category.key === row.category)?.label ?? row.category,
      published: row.isActive,
      version: row.updatedAt.toISOString(),
      photoUrl: photo?.url,
      priceBob: amounts.length ? Math.min(...amounts) : null,
    };
  });
}

export async function ProductManager() {
  let items: Awaited<ReturnType<typeof loadProductData>> | null = null;
  try {
    items = await loadProductData();
  } catch {
    items = null;
  }
  if (items === null) {
    return (
      <section className="empty-state">
        <h1>El catálogo no está disponible.</h1>
        <p>
          No pudimos conectar con la base de datos. Volvé a intentar cuando se restablezca la
          conexión.
        </p>
      </section>
    );
  }
  return (
    <section>
      <p className="eyebrow">Administración / Catálogo</p>
      <h1>Tus productos.</h1>
      <p className="page-intro">
        Creá fichas, añadí fotos y decidí qué aparece en el catálogo. Los precios se actualizan
        desde Precios.
      </p>
      <ProductList products={items} />
    </section>
  );
}
