import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatAmount } from "@/lib/precios";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Productos ElitePC",
  description: "Notebooks, monitores, impresoras y accesorios en Santa Cruz, Bolivia.",
};
export default async function Catalog({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string; page?: string }>;
}) {
  const search = await searchParams;
  const page = Math.max(1, Math.min(10000, Number(search.page) || 1));
  const where = {
    deletedAt: null,
    estado: "publicado",
    escondido: false,
    ...(search.categoria ? { categoriaId: search.categoria } : {}),
    ...(search.q
      ? {
          OR: [
            { titulo: { contains: search.q.slice(0, 160), mode: "insensitive" as const } },
            { sku: { contains: search.q.slice(0, 160), mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
  const [products, total, categories] = await Promise.all([
    prisma.producto.findMany({
      where,
      orderBy: [{ destacado: "desc" }, { orden: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * 24,
      take: 24,
      select: {
        id: true,
        slug: true,
        titulo: true,
        sku: true,
        precioSinFactura: true,
        precioConFactura: true,
        precioOferta: true,
        ofertaDesde: true,
        ofertaHasta: true,
        disponibilidad: true,
        imagenes: { orderBy: { orden: "asc" }, take: 1, select: { urlMiniatura: true, alt: true } },
      },
    }),
    prisma.producto.count({ where }),
    prisma.categoria.findMany({
      where: { padreId: null },
      orderBy: { orden: "asc" },
      select: { id: true, nombre: true },
    }),
  ]);
  return (
    <main id="main" className="shell page-section">
      <p className="eyebrow">ElitePC · Santa Cruz</p>
      <h1>Productos</h1>
      <form className="public-product-search">
        <input name="q" placeholder="Buscar por producto o SKU" defaultValue={search.q} />
        <select name="categoria" defaultValue={search.categoria || ""}>
          <option value="">Todas las categorías</option>
          {categories.map((v) => (
            <option key={v.id} value={v.id}>
              {v.nombre}
            </option>
          ))}
        </select>
        <button className="button">Buscar</button>
      </form>
      <div className="public-product-grid">
        {products.map((product) => {
          const active =
            product.precioOferta &&
            (!product.ofertaDesde || product.ofertaDesde <= new Date()) &&
            (!product.ofertaHasta || product.ofertaHasta >= new Date());
          return (
            <Link
              href={`/productos/${product.slug}`}
              className="public-product-card"
              key={product.id}
            >
              {product.imagenes[0] && (
                <Image
                  unoptimized
                  src={product.imagenes[0].urlMiniatura}
                  width={220}
                  height={170}
                  alt={product.imagenes[0].alt || product.titulo}
                />
              )}
              <small>{product.sku}</small>
              <h2>{product.titulo}</h2>
              {product.precioSinFactura && (
                <p>
                  {active ? (
                    <>
                      <del>{formatAmount(product.precioSinFactura)}</del>
                      <strong>{formatAmount(product.precioOferta)}</strong>
                    </>
                  ) : (
                    <strong>{formatAmount(product.precioSinFactura)}</strong>
                  )}{" "}
                  S/F
                </p>
              )}
              {product.precioConFactura && (
                <p>
                  <strong>{formatAmount(product.precioConFactura)}</strong> C/F
                </p>
              )}
              <span>
                {product.disponibilidad === "SIN_STOCK"
                  ? "Agotado"
                  : product.disponibilidad === "BAJO_PEDIDO"
                    ? "Bajo pedido"
                    : "Disponible"}
              </span>
            </Link>
          );
        })}
      </div>
      {!products.length && <p>No encontramos productos publicados para esta búsqueda.</p>}
      <nav className="public-product-search" aria-label="Paginación">
        {page > 1 && (
          <Link
            href={`/productos?q=${encodeURIComponent(search.q || "")}&categoria=${search.categoria || ""}&page=${page - 1}`}
          >
            Anterior
          </Link>
        )}
        <span>
          Página {page} de {Math.max(1, Math.ceil(total / 24))}
        </span>
        {page * 24 < total && (
          <Link
            href={`/productos?q=${encodeURIComponent(search.q || "")}&categoria=${search.categoria || ""}&page=${page + 1}`}
          >
            Siguiente
          </Link>
        )}
      </nav>
    </main>
  );
}
