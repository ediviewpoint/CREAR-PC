import { AdminForm } from "@/components/admin/AdminForm";
import { loginAction } from "@/app/_actions/auth";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminPasswordField } from "@/components/admin/AdminPasswordField";
export const metadata = {
  title: "Ingreso de administración",
  robots: { index: false, follow: false },
};
export default async function AdminLogin() {
  if ((await auth())?.user) redirect("/admin");
  return (
    <main id="main" className="shell page-section admin-login-page">
      <p className="eyebrow">ElitePC / Administración</p>
      <h1>Ingresa al panel</h1>
      <p className="page-intro">
        Administra tus productos, precios y cotizaciones con tu cuenta de ElitePC.
      </p>
      <AdminForm action={loginAction} label="Ingresar">
        <label htmlFor="email">Correo electrónico</label>
        <input id="email" name="email" type="email" autoComplete="username" required />
        <AdminPasswordField />
      </AdminForm>
      <Link className="text-link" href="/">
        ← Volver a la web
      </Link>
    </main>
  );
}
