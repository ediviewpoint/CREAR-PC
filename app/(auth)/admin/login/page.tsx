import { AdminForm } from "@/components/admin/AdminForm";
import { loginAdminAction } from "@/app/_actions/admin";
import { isAdmin } from "@/lib/auth/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminPasswordField } from "@/components/admin/AdminPasswordField";
export const metadata = {
  title: "Ingreso de administración",
  robots: { index: false, follow: false },
};
export default async function AdminLogin() {
  if (await isAdmin()) redirect("/admin");
  return (
    <main id="main" className="shell page-section admin-login-page">
      <p className="eyebrow">CREAR PC / Administración</p>
      <h1>Ingreso al taller.</h1>
      <p className="page-intro">
        Administrá tus productos, precios y proformas. Ingresá con tu contraseña; no necesitás un
        nombre de usuario.
      </p>
      <AdminForm action={loginAdminAction} label="Ingresar">
        <AdminPasswordField />
      </AdminForm>
      <Link className="text-link" href="/">
        ← Volver a la web
      </Link>
    </main>
  );
}
