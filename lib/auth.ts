import NextAuth, { type Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { authenticateCredentials } from "@/lib/auth-credentials";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-errors";
import { hasRole, type UserRole } from "@/lib/auth-permissions";

const sessionSeconds = 12 * 60 * 60;

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt", maxAge: sessionSeconds, updateAge: 30 * 60 },
  jwt: { maxAge: sessionSeconds },
  pages: { signIn: "/admin/login" },
  providers: [
    Credentials({
      name: "Correo y contraseña",
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize: (credentials, request) =>
        authenticateCredentials(
          credentials,
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim().slice(0, 100) ?? null,
        ),
    }),
    ...(process.env.AUTH_GOOGLE_ID &&
    process.env.AUTH_GOOGLE_SECRET &&
    process.env.AUTH_GOOGLE_DOMAIN
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true;
      const email = user.email?.trim().toLowerCase();
      const domain = process.env.AUTH_GOOGLE_DOMAIN?.trim().toLowerCase();
      if (
        !email ||
        !domain ||
        email.split("@")[1] !== domain ||
        !(profile as { email_verified?: boolean } | undefined)?.email_verified
      )
        return false;
      // DECISION: Google solo inicia sesión en cuentas que un ADMIN ya creó; no existe registro público.
      const registered = await prisma.usuario.findUnique({ where: { email } });
      if (
        !registered?.activo ||
        (registered.googleSub && registered.googleSub !== account.providerAccountId)
      )
        return false;
      await prisma.$transaction([
        prisma.usuario.update({
          where: { id: registered.id },
          data: { googleSub: account.providerAccountId, ultimoAcceso: new Date() },
        }),
        prisma.auditoria.create({
          data: { usuarioId: registered.id, accion: "login", detalle: { proveedor: "google" } },
        }),
      ]);
      user.id = registered.id;
      user.rol = registered.rol;
      user.versionSesion = registered.versionSesion;
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.rol = user.rol;
        token.versionSesion = user.versionSesion;
      }
      if (!token.sub) return null;
      const current = await prisma.usuario.findUnique({
        where: { id: token.sub },
        select: { activo: true, rol: true, versionSesion: true },
      });
      if (!current?.activo || token.versionSesion !== current.versionSesion) return null;
      token.rol = current.rol;
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub!;
      session.user.rol = token.rol as UserRole;
      return session;
    },
  },
  events: {
    async signOut(message) {
      if ("token" in message && message.token?.sub)
        await prisma.auditoria.create({
          data: { usuarioId: message.token.sub, accion: "logout", detalle: {} },
        });
    },
  },
});

export function requerirRol(session: Session | null, minimum: UserRole = "LECTOR") {
  if (!session?.user?.id) throw new ApiError("NO_AUTORIZADO", "Tu sesión expiró", 401);
  if (!hasRole(session.user.rol, minimum))
    throw new ApiError("SIN_PERMISO", "No tienes permiso para esta acción", 403);
  return session;
}
export async function requireSession(minimum: UserRole = "LECTOR") {
  return requerirRol(await auth(), minimum);
}
