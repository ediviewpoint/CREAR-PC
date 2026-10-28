import Link from "next/link";
import { ProductEditor } from "@/components/admin/ProductEditor";
import {
  PRODUCT_CATEGORIES,
  getSpecFields,
  type ProductCategory,
} from "@/lib/admin/component-fields";
import { workedBrands } from "@/lib/brand-showcase";
import { getProductCommerce } from "@/lib/admin/products";
export const metadata = { title: "Añadir producto" };
export const maxDuration = 120;
export default async function NewProductPage() {
  const commerce = await getProductCommerce();
  const fieldSets = Object.fromEntries(
    PRODUCT_CATEGORIES.map((category) => [category.key, getSpecFields(category.key)]),
  ) as Record<ProductCategory, ReturnType<typeof getSpecFields>>;
  return (
    <section>
      <Link className="text-link" href="/admin/componentes">
        ← Productos
      </Link>
      <p className="eyebrow">Catálogo / Nuevo producto</p>
      <h1>Cada ficha, en su lugar.</h1>
      <p className="page-intro">
        Guardá un borrador o publicá una ficha completa. No hace falta escribir código.
      </p>
      <ProductEditor
        aiConfigured={Boolean(process.env.ANTHROPIC_API_KEY)}
        commerce={commerce}
        categories={PRODUCT_CATEGORIES}
        fieldSets={fieldSets}
        brands={workedBrands.map((brand) => brand.name)}
      />
    </section>
  );
}
