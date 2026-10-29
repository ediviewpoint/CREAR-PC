import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { apiError, ApiError, readJson } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { getProduct, saveProduct } from "@/lib/productos/guardar";
import { ProductSchema } from "@/lib/productos/schema";
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
        historialId: z.string().min(1).max(100),
        campo: z.string().min(1).max(80),
        lado: z.enum(["antes", "despues"]).default("antes"),
      })
      .parse(await readJson(request));
    if (
      !Object.keys(ProductSchema.shape).includes(input.campo) ||
      ["updatedAt", "sku", "categoriaNombre"].includes(input.campo)
    )
      throw new ApiError("VALIDACION", "Este campo se restaura desde el formulario completo", 422);
    if (["costo", "monedaCosto"].includes(input.campo) && session.user.rol !== "ADMIN")
      throw new ApiError("SIN_PERMISO", "No tienes permiso para restaurar el costo", 403);
    const history = await prisma.productoHistorial.findFirst({
      where: { id: input.historialId, productoId: id },
    });
    const changes = history?.cambios;
    const entry = Array.isArray(changes)
      ? changes.find((v) => v && typeof v === "object" && "campo" in v && v.campo === input.campo)
      : null;
    if (!entry || typeof entry !== "object" || !(input.lado in entry))
      throw new ApiError("NO_ENCONTRADO", "No se encontró ese valor en el historial", 404);
    const current = await getProduct(id, session.user.rol);
    return Response.json(
      await saveProduct(
        { ...current, [input.campo]: (entry as Record<string, unknown>)[input.lado] },
        session.user,
        id,
        "restaurar",
      ),
    );
  } catch (error) {
    return apiError(error);
  }
}
