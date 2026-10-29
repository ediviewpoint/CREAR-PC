import { cleanDescription } from "@/lib/productos/guardar";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatAmount } from "@/lib/precios";
export const dynamic = "force-dynamic";
export default async function Product({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await prisma.producto.findFirst({
    where: { slug, deletedAt: null, estado: "publicado", escondido: false },
    select: {
      sku: true,
      titulo: true,
      descripcion: true,
      precioSinFactura: true,
      precioConFactura: true,
      precioOferta: true,
      ofertaDesde: true,
      ofertaHasta: true,
      disponibilidad: true,
      imagenes: { orderBy: { orden: "asc" }, select: { url: true, alt: true } },
      specs: { orderBy: { orden: "asc" }, select: { campo: true, valor: true } },
      destacados: { orderBy: { orden: "asc" }, select: { texto: true } },
      puntosClave: { orderBy: { orden: "asc" }, select: { titulo: true, descripcion: true } },
    },
  });
  if (!p) notFound();
  const active =
    p.precioOferta &&
    (!p.ofertaDesde || p.ofertaDesde <= new Date()) &&
    (!p.ofertaHasta || p.ofertaHasta >= new Date());
  const phone = (process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "").replace(/\D/g, "");
  return (
    <main id="main" className="shell page-section">
      <Link href="/productos">Regresar al catálogo</Link>
      <p className="eyebrow">{p.sku}</p>
      <h1>{p.titulo}</h1>
      <div className="public-product-detail">
        <div>
          {p.imagenes.map((image, i) => (
            <Image
              key={i}
              unoptimized
              src={image.url}
              width={600}
              height={450}
              alt={image.alt || p.titulo}
            />
          ))}
        </div>
        <section>
          {p.precioSinFactura && (
            <p>
              Sin factura:{" "}
              {active ? (
                <>
                  <del>{formatAmount(p.precioSinFactura)}</del>{" "}
                  <strong>{formatAmount(p.precioOferta)}</strong>
                </>
              ) : (
                <strong>{formatAmount(p.precioSinFactura)}</strong>
              )}
            </p>
          )}
          {p.precioConFactura && (
            <p>
              Con factura: <strong>{formatAmount(p.precioConFactura)}</strong>
            </p>
          )}
          <p>
            {p.disponibilidad === "SIN_STOCK"
              ? "Agotado"
              : p.disponibilidad === "BAJO_PEDIDO"
                ? "Bajo pedido"
                : "Disponible"}
          </p>
          <ul>
            {p.destacados.map((v, i) => (
              <li key={i}>{v.texto}</li>
            ))}
          </ul>
          {phone && (
            <a
              className="button"
              href={`https://wa.me/${phone}?text=${encodeURIComponent(`Hola, me interesa ${p.sku} ${p.titulo}`)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Consultar por WhatsApp
            </a>
          )}
          {p.puntosClave.map((v, i) => (
            <div key={i}>
              <h2>{v.titulo}</h2>
              <p>{v.descripcion}</p>
            </div>
          ))}
        </section>
      </div>
      <section>
        <h2>Especificaciones técnicas</h2>
        <dl className="public-product-specs">
          {p.specs.map((v, i) => (
            <div key={i}>
              <dt>{v.campo}</dt>
              <dd>{v.valor}</dd>
            </div>
          ))}
        </dl>
        {p.descripcion && (
          <div dangerouslySetInnerHTML={{ __html: cleanDescription(p.descripcion) }} />
        )}
      </section>
    </main>
  );
}
