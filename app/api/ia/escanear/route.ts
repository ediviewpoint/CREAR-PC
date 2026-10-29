import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { apiError, readJson } from "@/lib/api-errors";
import { createBatch } from "@/lib/ia/batch";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const session = await requireSession("EDITOR");
    const { imagenes } = z
      .object({ imagenes: z.array(z.url()).min(1).max(5) })
      .parse(await readJson(request));
    return Response.json(
      await createBatch(
        {
          tipoEntrada: "imagen",
          imagenes,
          opciones: {
            buscarModelo: false,
            generarDestacados: true,
            moneda: "Detectar",
            margen: 0,
            separar: "auto",
            separador: "",
          },
        },
        session.user,
      ),
    );
  } catch (error) {
    return apiError(error);
  }
}
