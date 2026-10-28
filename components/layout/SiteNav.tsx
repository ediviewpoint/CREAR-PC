"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export function SiteNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Principal">
      <Link href="/catalog" aria-current={pathname.startsWith("/catalog") ? "page" : undefined}>
        Componentes
      </Link>
      <Link
        href="/admin"
        aria-label="Administración"
        title="Administración del sitio"
        aria-current={pathname.startsWith("/admin") ? "page" : undefined}
      >
        Admin
      </Link>
      <Link
        className="header-build"
        href="/build"
        aria-current={pathname.startsWith("/build") ? "page" : undefined}
      >
        Armar mi PC <span aria-hidden="true">↗</span>
      </Link>
    </nav>
  );
}
