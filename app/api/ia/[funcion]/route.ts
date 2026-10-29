import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { apiError, ApiError, readJson } from "@/lib/api-errors";
import { aiJson } from "@/lib/ia/client";
import { modelSpecs } from "@/lib/ia/extraer";
import { DestacadosSchema, PuntosSchema } from "@/lib/ia/schemas";
import { writingPrompt } from "@/lib/ia/prompts";
import { SpecSchema } from "@/lib/productos/schema";
import { prisma } from "@/lib/prisma";
import { cleanDescription } from "@/lib/productos/guardar";
export const maxDuration = 60;
const Partial = z.object({
  titulo: z.string().max(160).optional(),
  marca: z.string().max(80).optional(),
  modelo: z.string().max(120).optional(),
  categoriaNombre: z.string().max(80).optional(),
  categoriaId: z.string().max(100).optional(),
  specs: z.array(SpecSchema).max(100).default([]),
  etiquetas: z.array(z.string().max(60)).max(40).default([]),
  puntosClave: z
    .array(z.object({ titulo: z.string().max(80), descripcion: z.string().max(220) }))
    .max(4)
    .default([]),
});
export async function POST(request: Request, { params }: { params: Promise<{ funcion: string }> }) {
  try {
    const session = await requireSession("EDITOR");
    const { funcion } = await params;
    const raw = await readJson(request);
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(45000)]);
    if (funcion === "specs-por-modelo")
      return Response.json(await modelSpecs(raw, session.user, signal));
    const input = z
      .object({ productoParcial: Partial, titulos: z.array(z.string().max(80)).max(4).optional() })
      .parse(raw);
    const prompt = writingPrompt(funcion, input.productoParcial, input.titulos);
    if (funcion === "destacados")
      return Response.json(
        (await aiJson(DestacadosSchema, prompt, session.user, funcion, { signal })).data,
      );
    if (funcion === "puntos-clave")
      return Response.json(
        (await aiJson(PuntosSchema, prompt, session.user, funcion, { signal })).data,
      );
    if (funcion === "descripcion") {
      const result = await aiJson(
        z.object({ descripcionHtml: z.string().max(10000) }),
        prompt,
        session.user,
        funcion,
        { signal },
      );
      return Response.json({ descripcionHtml: cleanDescription(result.data.descripcionHtml) });
    }
    if (funcion === "titulo")
      return Response.json(
        (
          await aiJson(
            z.object({ titulo: z.string().min(5).max(160) }),
            prompt,
            session.user,
            funcion,
            { signal },
          )
        ).data,
      );
    if (funcion === "etiquetas")
      return Response.json(
        (
          await aiJson(
            z.object({ etiquetas: z.array(z.string().max(60)).max(6) }),
            prompt,
            session.user,
            funcion,
            { signal },
          )
        ).data,
      );
    if (funcion === "traducir")
      return Response.json(
        (
          await aiJson(
            z.object({ specs: z.array(SpecSchema).max(100) }),
            prompt,
            session.user,
            funcion,
            { signal },
          )
        ).data,
      );
    if (funcion === "categoria") {
      const categories = await prisma.categoria.findMany({
        select: { id: true, nombre: true, padreId: true },
      });
      const result = await aiJson(
        z.object({ categoriaId: z.string().nullable(), subcategoriaId: z.string().nullable() }),
        `${prompt}\nElige exclusivamente una categoría principal y una hija de esta lista: ${JSON.stringify(categories)}`,
        session.user,
        funcion,
        { signal },
      );
      if (!categories.some((v) => v.id === result.data.categoriaId && !v.padreId))
        throw new ApiError("IA_SALIDA_INVALIDA", "La IA no encontró una categoría válida", 502);
      return Response.json(result.data);
    }
    throw new ApiError("NO_ENCONTRADO", "Función no encontrada", 404);
  } catch (error) {
    return apiError(error);
  }
}
