import { notFound } from "next/navigation";
import { auth, requerirRol } from "@/lib/auth";
const modules: Record<string, { title: string; phase: number; description: string }> = {
  productos: {
    title: "Productos",
    phase: 2,
    description: "Listado, búsqueda, filtros y acciones del catálogo.",
  },
  "productos/nuevo": {
    title: "Nuevo producto",
    phase: 3,
    description: "Alta manual y extracción de fichas con IA.",
  },
  categorias: {
    title: "Categorías",
    phase: 3,
    description: "Categorías, subcategorías y campos técnicos sugeridos.",
  },
  etiquetas: {
    title: "Etiquetas",
    phase: 3,
    description: "Etiquetas compartidas por el catálogo.",
  },
  "batch-ia": {
    title: "Batch IA",
    phase: 5,
    description: "Procesamiento y revisión de múltiples productos.",
  },
  cotizacion: { title: "Cotización", phase: 6, description: "Precios congelados y fichas PDF." },
  historial: { title: "Historial", phase: 3, description: "Cambios y auditoría de productos." },
  wordpress: {
    title: "WordPress",
    phase: 6,
    description: "Publicación y sincronización del catálogo.",
  },
  tickets: {
    title: "Tickets",
    phase: 6,
    description: "Buscador de equipos y repuestos para servicio técnico.",
  },
  configuracion: {
    title: "Configuración",
    phase: 6,
    description: "Usuarios, roles, precios, plantillas y límites de IA.",
  },
};
export default async function ModulePage({ params }: { params: Promise<{ modulo: string[] }> }) {
  const { modulo } = await params;
  const key = modulo.join("/");
  const item = modules[key];
  if (!item) notFound();
  if (key === "configuracion") requerirRol(await auth(), "ADMIN");
  return (
    <>
      <div className="elite-page-header">
        <div>
          <h1>{item.title}</h1>
          <p>{item.description}</p>
        </div>
      </div>
      <section className="elite-card">
        <h2>En preparación</h2>
        <p className="elite-muted">
          Este módulo se implementa en la fase {item.phase}. La navegación y los permisos ya están
          preparados.
        </p>
      </section>
    </>
  );
}
