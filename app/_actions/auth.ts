"use server";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
export async function loginAction(_state: { message: string }, form: FormData) {
  try {
    await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirectTo: "/admin",
    });
  } catch (error) {
    if (error instanceof AuthError)
      return {
        message:
          "No se pudo ingresar. Revisa tu correo y contraseña; tras cinco intentos fallidos la cuenta se bloquea 15 minutos.",
      };
    throw error;
  }
  return { message: "" };
}
export async function logoutAction() {
  await signOut({ redirectTo: "/admin/login" });
}
