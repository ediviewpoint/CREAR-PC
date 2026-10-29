import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { apiError, readJson } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
const Schema = z
  .object({
    columnas: z.partialRecord(
      z.enum([
        "drag",
        "seleccion",
        "imagen",
        "titulo",
        "categoria",
        "subcategoria",
        "etiquetas",
        "precioSinFactura",
        "precioConFactura",
        "precioUsd",
        "tipo",
        "disponibilidad",
        "acciones",
      ]),
      z.boolean(),
    ),
  })
  .strict();
export async function PATCH(request: Request) {
  try {
    const session = await requireSession();
    const data = Schema.parse(await readJson(request));
    await prisma.$executeRaw`UPDATE "Usuario" SET preferencias=jsonb_set(preferencias,'{columnasProductos}',${JSON.stringify(data.columnas)}::jsonb,true) WHERE id=${session.user.id}`;
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
