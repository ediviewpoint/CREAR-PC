import { requireSession } from "@/lib/auth";
import { apiError, readJson } from "@/lib/api-errors";
import { bulkProducts } from "@/lib/productos/bulk";
import { z } from "zod";
import { publishWp } from "@/lib/wordpress";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const session = await requireSession("EDITOR");
    const input = await readJson(request);
    if (input && typeof input === "object" && "accion" in input && input.accion === "publicarWp") {
      const data = z
        .object({
          accion: z.literal("publicarWp"),
          ids: z.array(z.string().min(1).max(100)).min(1).max(3),
        })
        .strict()
        .parse(input);
      const resultados = [];
      for (const id of data.ids) resultados.push(await publishWp(id, session.user));
      return Response.json({ resultados });
    }
    return Response.json(await bulkProducts(input, session.user));
  } catch (error) {
    return apiError(error);
  }
}
