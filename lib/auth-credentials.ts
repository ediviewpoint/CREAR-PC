import { compare, hashSync } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
const credentialsSchema = z.object({
  email: z.email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(1).max(1024),
});
const dummyHash = hashSync("usuario-inexistente-elitepc", 12);

export async function authenticateCredentials(raw: unknown, ip: string | null = null) {
  const parsed = credentialsSchema.safeParse(raw);
  if (!parsed.success) return null;
  const { email, password } = parsed.data;
  return prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Usuario" WHERE "email" = ${email} FOR UPDATE`;
      const user = await tx.usuario.findUnique({ where: { email } });
      if (!user) {
        await compare(password, dummyHash);
        await tx.auditoria.create({ data: { accion: "login_fallido", ip, detalle: { email } } });
        return null;
      }
      if (!user.activo || (user.bloqueadoHasta && user.bloqueadoHasta > new Date())) {
        await tx.auditoria.create({
          data: { usuarioId: user.id, accion: "login_bloqueado", ip, detalle: {} },
        });
        return null;
      }
      const valid = await compare(password, user.passwordHash || dummyHash);
      if (!valid || !user.passwordHash) {
        const failures = user.bloqueadoHasta ? 1 : user.intentosFallidos + 1;
        await tx.usuario.update({
          where: { id: user.id },
          data: {
            intentosFallidos: failures,
            bloqueadoHasta: failures >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null,
          },
        });
        await tx.auditoria.create({
          data: {
            usuarioId: user.id,
            accion: "login_fallido",
            ip,
            detalle: { intentos: failures },
          },
        });
        return null;
      }
      await tx.usuario.update({
        where: { id: user.id },
        data: { intentosFallidos: 0, bloqueadoHasta: null, ultimoAcceso: new Date() },
      });
      await tx.auditoria.create({
        data: { usuarioId: user.id, accion: "login", ip, detalle: { proveedor: "credenciales" } },
      });
      return {
        id: user.id,
        name: user.nombre,
        email: user.email,
        rol: user.rol,
        versionSesion: user.versionSesion,
      };
    },
    { timeout: 15000 },
  );
}
