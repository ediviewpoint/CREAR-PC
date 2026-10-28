import "server-only";
import { randomBytes, createHash } from "node:crypto";
import { cookies } from "next/headers";
const KEY = "crearpc.visitor";
export async function visitorHash(create = false): Promise<string | null> {
  const jar = await cookies();
  let token = jar.get(KEY)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    if (!create) return null;
    token = randomBytes(32).toString("hex");
    jar.set(KEY, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return createHash("sha256").update(token).digest("hex");
}
