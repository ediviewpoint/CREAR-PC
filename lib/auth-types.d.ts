import type { DefaultSession } from "next-auth";
import type { UserRole } from "./auth-permissions";
declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & { id: string; rol: UserRole };
  }
  interface User {
    rol: UserRole;
    versionSesion: number;
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    rol?: UserRole;
    versionSesion?: number;
  }
}
