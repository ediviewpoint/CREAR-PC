import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { apiError, ApiError, readJson } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { getBatch, type BatchItem } from "@/lib/ia/batch";
import { MappingSchema, mappedRow } from "@/lib/importacion";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession("EDITOR");
    const id = z
      .string()
      .min(1)
      .max(100)
      .parse((await params).id);
    const input = z
      .object({
        mapeo: MappingSchema,
        plantilla: z.string().max(80).optional(),
        duplicados: z.enum(["actualizar", "saltar", "crear"]).default("actualizar"),
        usarIA: z.boolean().default(false),
        categoriaId: z.string().optional(),
        sucursalId: z.string().optional(),
      })
      .parse(await readJson(request));
    const job = await getBatch(id, session.user);
    if (job.estado !== "mapeo")
      throw new ApiError("CONFLICTO_VERSION", "La importación ya fue confirmada", 409);
    const categories = await prisma.categoria.findMany();
    const items: BatchItem[] = [];
    for (const row of job.items as unknown as Record<string, unknown>[]) {
      const mapped = mappedRow(row, input.mapeo);
      const category = categories.find(
        (v) => v.nombre.toUpperCase() === String(mapped.categoria || "").toUpperCase(),
      );
      const product = {
        ...mapped,
        categoriaId: category?.id || input.categoriaId,
        modelo: String(mapped.modelo || ""),
        marca: String(mapped.marca || ""),
        titulo: String(mapped.titulo || ""),
        sku: String(mapped.sku || ""),
      };
      delete (product as Record<string, unknown>).categoria;
      delete (product as Record<string, unknown>).imagen;
      delete (product as Record<string, unknown>).stock;
      delete (product as Record<string, unknown>).sucursal;
      if (mapped.stock !== undefined && input.sucursalId)
        Object.assign(product, {
          controlaInventario: true,
          stocks: [{ sucursalId: input.sucursalId, cantidad: Number(mapped.stock) }],
        });
      if (session.user.rol !== "ADMIN") delete (product as Record<string, unknown>).costo;
      const existing = product.sku
        ? await prisma.producto.findUnique({
            where: { sku: product.sku },
            select: { id: true, sku: true, titulo: true, updatedAt: true },
          })
        : null;
      items.push({
        imagenUrl: typeof mapped.imagen === "string" ? mapped.imagen : undefined,
        id: crypto.randomUUID(),
        textoOriginal: Object.entries(row)
          .map(([key, value]) => `${key}: ${value ?? ""}`)
          .join("\n"),
        estado: existing
          ? input.duplicados === "saltar"
            ? "descartado"
            : "duplicado"
          : input.usarIA
            ? "en_cola"
            : "revisar",
        producto: product,
        duplicados: existing ? [{ ...existing, updatedAt: existing.updatedAt.toISOString() }] : [],
      });
    }
    await prisma.trabajoBatch.update({
      where: { id },
      data: {
        items: JSON.parse(JSON.stringify(items)),
        estado: input.usarIA ? "en_cola" : "revision",
        procesados: input.usarIA ? 0 : items.length,
        opciones: {
          moneda: "Detectar",
          buscarModelo: false,
          generarDestacados: false,
          margen: 0,
          separar: "auto",
          separador: "",
          duplicados: input.duplicados,
        },
      },
    });
    if (input.plantilla)
      await prisma.configuracion.upsert({
        where: { clave: `importacion:${input.plantilla}` },
        create: { clave: `importacion:${input.plantilla}`, valor: input.mapeo },
        update: { valor: input.mapeo },
      });
    return Response.json({ trabajoId: id });
  } catch (error) {
    return apiError(error);
  }
}
