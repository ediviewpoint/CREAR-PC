"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Package,
  Zap,
  FileText,
  History,
  Globe,
  Ticket,
  Barcode,
  Calculator,
  Settings,
  ChevronDown,
  Tags,
  Layers3,
  Plus,
  Wallet,
  Landmark,
} from "lucide-react";
import { Tooltip } from "radix-ui";
import { hasRole, type UserRole } from "@/lib/auth-permissions";
const modules = [
  { label: "Inicio", href: "/admin", icon: Home },
  { label: "Productos", href: "/admin/productos", icon: Package },
  { label: "Batch IA", href: "/admin/batch-ia", icon: Zap },
  { label: "Cotización", href: "/admin/cotizacion", icon: FileText },
  { label: "Historial", href: "/admin/historial", icon: History },
  { label: "WordPress", href: "/admin/wordpress", icon: Globe },
  { label: "Tickets", href: "/admin/tickets", icon: Ticket },
  { label: "Inventario", href: "/admin/inventario", icon: Barcode, disabled: true },
  { label: "Ventas", href: "/admin/ventas", icon: Calculator, disabled: true },
  { label: "Tesorería", href: "/admin/tesoreria", icon: Wallet, disabled: true },
  { label: "Contabilidad", href: "/admin/contabilidad", icon: Landmark, disabled: true },
  { label: "Configuración", href: "/admin/configuracion", icon: Settings, admin: true },
] as const;
const productLinks = [
  { label: "Todos los productos", href: "/admin/productos", icon: Package },
  { label: "Nuevo producto", href: "/admin/productos/nuevo", icon: Plus },
  { label: "Categorías", href: "/admin/categorias", icon: Layers3 },
  { label: "Etiquetas", href: "/admin/etiquetas", icon: Tags },
] as const;
export function Sidebar({
  collapsed,
  role,
  onNavigate,
}: {
  collapsed: boolean;
  role: UserRole;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <aside className={`elite-sidebar ${collapsed ? "is-collapsed" : ""}`} aria-label="Módulos">
      <nav aria-label="Módulos administrativos">
        {modules
          .filter((module) => !("admin" in module && module.admin) || role === "ADMIN")
          .map((module) => {
            const selected =
              module.href === "/admin"
                ? pathname === module.href
                : pathname.startsWith(module.href) ||
                  (module.href === "/admin/productos" &&
                    /\/admin\/(categorias|etiquetas)/.test(pathname));
            const Icon = module.icon;
            if ("disabled" in module)
              return (
                <Tooltip.Root key={module.href}>
                  <Tooltip.Trigger asChild>
                    <button
                      type="button"
                      aria-disabled="true"
                      className="elite-module is-disabled"
                      aria-label={`${module.label}. Próximamente`}
                    >
                      <Icon aria-hidden="true" />
                      <span>{module.label}</span>
                      {!collapsed && <small>Próximamente</small>}
                    </button>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content className="elite-tooltip" side="right">
                      Módulo en desarrollo
                      <Tooltip.Arrow />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              );
            return (
              <div key={module.href}>
                <Link
                  href={module.href}
                  className={`elite-module ${selected ? "is-active" : ""}`}
                  aria-current={selected ? "page" : undefined}
                  onClick={onNavigate}
                >
                  <Icon aria-hidden="true" />
                  <span>{module.label}</span>
                  {module.href === "/admin/productos" && !collapsed && (
                    <ChevronDown size={15} className="elite-chevron" aria-hidden="true" />
                  )}
                </Link>
                {module.href === "/admin/productos" && selected && !collapsed && (
                  <div className="elite-submenu">
                    {productLinks
                      .filter(
                        (item) => item.href !== "/admin/productos/nuevo" || hasRole(role, "EDITOR"),
                      )
                      .map(({ label, href, icon: SubIcon }) => (
                        <Link
                          key={href}
                          href={href}
                          aria-current={pathname === href ? "page" : undefined}
                          onClick={onNavigate}
                        >
                          <SubIcon size={15} aria-hidden="true" />
                          {label}
                        </Link>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
      </nav>
    </aside>
  );
}
