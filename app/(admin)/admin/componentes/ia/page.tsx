import Link from "next/link";
import { ProductAiAssistant } from "@/components/admin/ProductAiAssistant";
import {
  PRODUCT_CATEGORIES,
  getSpecFields,
  type ProductCategory,
} from "@/lib/admin/component-fields";
export const metadata = { title: "Cargar productos con IA" };
export const maxDuration = 120;
export default function AiProductsPage() {
  const fieldSets = Object.fromEntries(
    PRODUCT_CATEGORIES.map((category) => [category.key, getSpecFields(category.key)]),
  ) as Record<ProductCategory, ReturnType<typeof getSpecFields>>;
  return (
    <section>
      <Link className="text-link" href="/admin/componentes">
        ← Productos
      </Link>
      <p className="eyebrow">Administración / Claude</p>
      <h1>De una lista a tus fichas.</h1>
      <p className="page-intro">
        La IA prepara identificación y especificaciones para que las revises en una tanda. Ningún
        producto se publica automáticamente.
      </p>
      <ProductAiAssistant
        configured={Boolean(process.env.ANTHROPIC_API_KEY)}
        categories={PRODUCT_CATEGORIES}
        fieldSets={fieldSets}
        batch
      />
    </section>
  );
}
