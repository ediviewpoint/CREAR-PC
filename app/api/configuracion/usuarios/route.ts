import { hash } from "bcryptjs";
import { requireSession } from "@/lib/auth";
import { apiError, ApiError, readJson } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { UserSchema } from "@/lib/admin-settings";
export async function POST(request: Request) {
  try {
    const session = await requireSession("ADMIN");
    const input = UserSchema.parse(await readJson(request));
    const passwordHash = input.password ? await hash(input.password, 12) : undefined;
    if (
      !input.id &&
      !passwordHash &&
      (!process.env.AUTH_GOOGLE_DOMAIN ||
        input.email.split("@")[1] !== process.env.AUTH_GOOGLE_DOMAIN)
    )
      throw new ApiError("VALIDACION", "Define una contraseña de al menos 12 caracteres", 422);
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext('elitepc-users'))::text`;
      const previous = input.id ? await tx.usuario.findUnique({ where: { id: input.id } }) : null;
      if (
        previous?.rol === "ADMIN" &&
        previous.activo &&
        (input.rol !== "ADMIN" || !input.activo) &&
        (await tx.usuario.count({ where: { rol: "ADMIN", activo: true } })) <= 1
      )
        throw new ApiError("VALIDACION", "Debe quedar al menos un administrador activo", 422);
      const data = {
        nombre: input.nombre,
        email: input.email,
        rol: input.rol,
        activo: input.activo,
        ...(passwordHash ? { passwordHash } : {}),
      };
      const user = input.id
        ? await tx.usuario.update({
            where: { id: input.id },
            data: {
              ...data,
              versionSesion: { increment: 1 },
              intentosFallidos: 0,
              bloqueadoHasta: null,
            },
          })
        : await tx.usuario.create({ data });
      await tx.auditoria.create({
        data: {
          usuarioId: session.user.id,
          accion: previous ? "usuario_editar" : "usuario_crear",
          detalle: {
            usuarioId: user.id,
            rolAntes: previous?.rol || null,
            rolDespues: user.rol,
            activo: user.activo,
            cambioPassword: !!passwordHash,
          },
        },
      });
    });
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
