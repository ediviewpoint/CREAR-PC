import { AdminForm } from "@/components/admin/AdminForm";
import { loginAdminAction } from "@/app/_actions/admin";
export const metadata = {
  title: "Ingreso de administración",
  robots: { index: false, follow: false },
};
export default function AdminLogin() {
  return (
    <main id="main" className="shell page-section">
      <p className="eyebrow">CREAR PC / Administración</p>
      <h1>Ingreso al taller.</h1>
      <AdminForm action={loginAdminAction} label="Ingresar">
        <label>
          Contraseña de administración
          <input name="password" type="password" required autoComplete="current-password" />
        </label>
      </AdminForm>
    </main>
  );
}
