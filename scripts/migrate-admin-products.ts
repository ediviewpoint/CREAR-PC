import { createRequire } from "node:module";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "../generated/prisma/client";
import { generateKeyBetween } from "fractional-indexing";
import { nextSku, SKU_PATTERN } from "../lib/sku";
import { slugify } from "../lib/slug";
import { seedBase } from "../prisma/seed";
const require = createRequire(import.meta.url);
createRequire(require.resolve("next/package.json"))("@next/env").loadEnvConfig(process.cwd());
const client = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 1 }),
});
type Legacy = {
  id: string;
  category: string;
  brand: string;
  model: string;
  name_display: string;
  spec: Prisma.JsonObject;
  sources: Prisma.JsonValue;
  is_active: boolean;
  created_at: Date;
};
async function main() {
  await seedBase(client);
  const rows = await client.$queryRaw<
    Legacy[]
  >`SELECT id,category::text,brand,model,name_display,spec,sources,is_active,created_at FROM components ORDER BY created_at,id`;
  let migrated = 0;
  let skipped = 0;
  for (const row of rows) {
    if (
      await client.producto.findUnique({
        where: { legacyComponentId: row.id },
        select: { id: true },
      })
    ) {
      skipped++;
      continue;
    }
    await client.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext('elitepc-product-order'))::text`;
        const category = await tx.categoria.findUniqueOrThrow({
          where: { slug: row.category === "monitor" ? "monitor" : "repuesto" },
        });
        const brand = await tx.marca.upsert({
          where: { nombre: row.brand },
          create: { nombre: row.brand },
          update: {},
        });
        const [price] = await tx.$queryRaw<
          { amount: string; currency: string; in_stock: boolean; stock_qty: number | null }[]
        >`SELECT p.amount::text,p.currency::text,p.in_stock,p.stock_qty FROM prices p JOIN stores s ON s.id=p.store_id WHERE p.component_id=${row.id}::uuid AND s.is_own=true ORDER BY p.observed_at DESC LIMIT 1`;
        const [last] = await tx.$queryRaw<
          { orden: string }[]
        >`SELECT orden FROM "Producto" ORDER BY orden COLLATE "C" DESC LIMIT 1`;
        const sourceSku = typeof row.spec.sku === "string" ? row.spec.sku.toUpperCase() : null;
        const sku =
          sourceSku &&
          SKU_PATTERN.test(sourceSku) &&
          !(await tx.producto.findUnique({ where: { sku: sourceSku } }))
            ? sourceSku
            : await nextSku(tx);
        const amount = price ? Math.round(Number(price.amount) * 100) : null;
        const imageRows = await tx.$queryRaw<
          { id: string; url: string; alt_es: string; width: number; height: number }[]
        >`SELECT id,url,alt_es,width,height FROM component_images WHERE component_id=${row.id}::uuid ORDER BY is_primary DESC,sort_order,id LIMIT 10`;
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.ofertas333.com";
        const existingSlug = slugify(row.name_display);
        const slug = (await tx.producto.findUnique({ where: { slug: existingSlug } }))
          ? `${existingSlug.slice(0, 100)}-${sku.toLowerCase()}`
          : existingSlug;
        const product = await tx.producto.create({
          data: {
            sku,
            slug,
            titulo: row.name_display
              .replace(/\bAGOTADO\b/gi, "")
              .replace(/\p{Extended_Pictographic}/gu, "")
              .trim()
              .slice(0, 160),
            tituloManual: true,
            marcaId: brand.id,
            modelo: row.model,
            categoriaId: category.id,
            orden: generateKeyBetween(last?.orden || null, null),
            legacyComponentId: row.id,
            datosCompatibilidad: { categoria: row.category, spec: row.spec, fuentes: row.sources },
            creadoPorId: "sistema",
            estado: amount && price?.currency === "BOB" ? "publicado" : "borrador",
            precioSinFactura: price?.currency === "BOB" ? amount : null,
            precioUsd: price?.currency === "USD" ? amount : null,
            disponibilidad: price ? (price.in_stock ? "EN_STOCK" : "SIN_STOCK") : "BAJO_PEDIDO",
            escondido: !row.is_active,
            requiereRevision: true,
            createdAt: row.created_at,
            specs: {
              create: Object.entries(row.spec)
                .filter(
                  ([key, value]) =>
                    !["sku", "ownPrice"].includes(key) &&
                    value !== null &&
                    typeof value !== "object",
                )
                .slice(0, 100)
                .map(([campo, valor], orden) => ({
                  campo: campo.slice(0, 80),
                  valor: String(valor),
                  orden,
                  origen: "IMPORTACION",
                  confirmado: true,
                })),
            },
            imagenes: {
              create: imageRows.map((image, orden) => {
                const url = image.url.startsWith("data:")
                  ? `${baseUrl.replace(/\/$/, "")}/api/product-images/${image.id}`
                  : image.url;
                return {
                  url,
                  urlMiniatura: url,
                  alt: image.alt_es,
                  ancho: image.width,
                  alto: image.height,
                  orden,
                };
              }),
            },
          },
        });
        await tx.productoHistorial.create({
          data: {
            productoId: product.id,
            usuarioId: "sistema",
            accion: "importar",
            origen: "migracion_catalogo",
            cambios: [{ campo: "legacyComponentId", antes: null, despues: row.id }],
          },
        });
      },
      { timeout: 30000 },
    );
    migrated++;
  }
  console.log(
    JSON.stringify({
      migrados: migrated,
      yaExistentes: skipped,
      proformas: "conservadas",
      stock: "sin inventar cantidades por sucursal",
    }),
  );
}
main()
  .catch(() => {
    console.error(
      "No se pudo completar la migración de productos. Es idempotente; puedes reanudarla sin duplicar.",
    );
    process.exitCode = 1;
  })
  .finally(() => client.$disconnect());
