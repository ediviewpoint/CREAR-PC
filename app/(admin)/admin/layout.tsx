import type { ReactNode } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { logoutAdminAction } from "@/app/_actions/admin";
export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };
const NAV = [
  ["/admin", "Resumen"],
  ["/admin/componentes", "Componentes"],
  ["/admin/precios", "Precios"],
  ["/admin/tiendas", "Tiendas"],
  ["/admin/builds", "Builds"],
  ["/admin/proformas", "Proformas"],
] as const;
export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  return (
    <div className="admin-shell shell">
      <aside className="admin-side">
        <h2>CREAR PC / Taller</h2>
        <nav aria-label="Administración">
          {NAV.map(([href, label]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>
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
