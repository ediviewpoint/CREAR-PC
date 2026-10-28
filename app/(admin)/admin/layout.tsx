import type { ReactNode } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { logoutAdminAction } from "@/app/_actions/admin";
import { AdminNav } from "@/components/admin/AdminNav";
export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };
export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  return (
    <div className="admin-shell shell">
      <aside className="admin-side">
        <h2>CREAR PC / Taller</h2>
        <AdminNav />
        <Link className="text-link admin-return-link" href="/">
          ← Volver a la web
        </Link>
        <form action={logoutAdminAction}>
          <button className="button button--ghost">Cerrar sesión</button>
        </form>
      </aside>
      <main id="main" className="admin-main">
        {children}
      </main>
    </div>
  );
}
