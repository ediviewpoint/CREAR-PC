import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
// DECISION: las pantallas heredadas conservan acceso exclusivo ADMIN mediante Auth.js.
export async function isAdmin() {
  return (await auth())?.user.rol === "ADMIN";
}
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
