import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
const COOKIE = "crearpc.admin";
function sign(value: string) {
  return createHmac("sha256", process.env.ADMIN_PASSWORD ?? "")
    .update(value)
    .digest("hex");
}
export function passwordMatches(input: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || expected.length < 16) return false;
  const a = Buffer.from(sign(input)),
    b = Buffer.from(sign(expected));
  return a.length === b.length && timingSafeEqual(a, b);
}
export async function isAdmin() {
  const key = process.env.ADMIN_PASSWORD;
  if (!key || key.length < 16) return false;
  const value = (await cookies()).get(COOKIE)?.value;
  const [expires, signature] = value?.split(".") ?? [];
  if (
    !expires ||
    !signature ||
    !/^\d{13}$/.test(expires) ||
    !/^[a-f0-9]{64}$/.test(signature) ||
    Number(expires) < Date.now() ||
    Number(expires) > Date.now() + 9 * 3600000
  )
    return false;
  const expected = sign(expires);
  return (
    signature.length === expected.length &&
    timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  );
}
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
export async function startAdminSession() {
  const expires = String(Date.now() + 8 * 3600000);
  (await cookies()).set(COOKIE, expires + "." + sign(expires), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 8 * 3600,
  });
}
export async function endAdminSession() {
  (await cookies()).delete(COOKIE);
}
