"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  ["/admin", "Resumen"],
  ["/admin/componentes", "Productos"],
  ["/admin/precios", "Precios"],
  ["/admin/tiendas", "Tiendas"],
  ["/admin/builds", "Equipos guardados"],
  ["/admin/proformas", "Proformas"],
] as const;

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Administración">
      {links.map(([href, label]) => (
        <Link
          key={href}
          href={href}
          aria-current={
            pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`))
              ? "page"
              : undefined
          }
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
