import Link from "next/link";
import { ProductCsvImport } from "@/components/admin/ProductCsvImport";
import { PRODUCT_CATEGORIES } from "@/lib/admin/component-fields";
export const metadata={title:"Importar productos"};
export default function ImportProductsPage(){return <section><Link className="text-link" href="/admin/componentes">← Productos</Link><p className="eyebrow">Administración / Importación</p><h1>Cargá tu catálogo por lotes.</h1><p className="page-intro">Se crean productos nuevos como borradores. La importación no modifica productos existentes y se guarda completa o no se guarda.</p><ProductCsvImport categories={PRODUCT_CATEGORIES}/></section>;}
