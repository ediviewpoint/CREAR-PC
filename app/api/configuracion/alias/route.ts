import { requireSession } from "@/lib/auth";
import { apiError, readJson } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { AliasSchema } from "@/lib/admin-settings";
export async function POST(request: Request) {
  try {
    const session = await requireSession("ADMIN");
    const input = AliasSchema.parse(await readJson(request));
    const valor = input.tipo === "marca" ? input.valor.toLowerCase() : input.valor.toUpperCase();
    await prisma.$transaction([
      prisma.alias.upsert({
        where: { tipo_valor: { tipo: input.tipo, valor } },
        create: { ...input, valor },
        update: { normalizado: input.normalizado },
      }),
      prisma.auditoria.create({
        data: {
          usuarioId: session.user.id,
          accion: "alias_editar",
          detalle: { tipo: input.tipo, valor, normalizado: input.normalizado },
        },
      }),
    ]);
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
