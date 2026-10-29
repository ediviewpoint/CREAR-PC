"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { DropdownMenu, Tooltip } from "radix-ui";
import {
  Menu,
  Search,
  Sun,
  Moon,
  ChevronDown,
  UserRound,
  LogOut,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";
import { logoutAction } from "@/app/_actions/auth";
import type { ExchangeRate } from "@/lib/configuracion";
import type { UserRole } from "@/lib/auth-permissions";
import type { RefObject } from "react";
export function Topbar({
  user,
  branches,
  branch,
  onBranch,
  theme,
  onTheme,
  onMenu,
  onSearch,
  menuRef,
  initialRate,
}: {
  user: { nombre: string; rol: UserRole };
  branches: { id: string; nombre: string }[];
  branch: string;
  onBranch: (id: string) => void;
  theme: string;
  onTheme: () => void;
  onMenu: () => void;
  onSearch: () => void;
  menuRef: RefObject<HTMLButtonElement | null>;
  initialRate: ExchangeRate;
}) {
  const rate = useQuery({
    queryKey: ["tipo-cambio"],
    queryFn: async () => {
      const response = await fetch("/api/tipo-cambio", { cache: "no-store" });
      if (!response.ok) throw new Error("No se pudo actualizar el tipo de cambio");
      return response.json() as Promise<ExchangeRate>;
    },
    initialData: initialRate,
    refetchInterval: 30 * 60 * 1000,
    staleTime: 30 * 60 * 1000,
  });
  const current = rate.data;
  return (
    <header className="elite-topbar">
      <Link href="/admin" className="elite-logo" aria-label="ElitePC Inicio">
        <span>
          elite<span>pc</span>
        </span>
        <small>Administración</small>
      </Link>
      <button
        ref={menuRef}
        type="button"
        className="elite-icon-button"
        onClick={onMenu}
        aria-label="Alternar menú principal"
      >
        <Menu aria-hidden="true" />
      </button>
      <span className="elite-region" title="Bolivia · moneda predeterminada BOB">
        <svg viewBox="0 0 24 16" width="24" height="16" role="img" aria-label="Bolivia">
          <path fill="#D52B1E" d="M0 0h24v5.33H0z" />
          <path fill="#F9E300" d="M0 5.33h24v5.34H0z" />
          <path fill="#007934" d="M0 10.67h24V16H0z" />
        </svg>
        <span>BOB</span>
      </span>
      <button className="elite-global-search" type="button" onClick={onSearch}>
        <Search size={17} aria-hidden="true" />
        <span>Buscar productos</span>
        <kbd>Ctrl K</kbd>
      </button>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            className="elite-rate"
            type="button"
            aria-label={`Tipo de cambio ${current.valor.toFixed(2)}${current.aviso || rate.isError ? ", valor de respaldo" : ""}`}
          >
            TC {current.valor.toFixed(2).replace(".", ",")}
            {(current.aviso || rate.isError) && (
              <AlertTriangle size={15} aria-label="Verificar tipo de cambio" />
            )}
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="elite-tooltip">
            {current.fuente} ·{" "}
            {current.fecha
              ? new Intl.DateTimeFormat("es-BO", {
                  dateStyle: "short",
                  timeStyle: "short",
                  timeZone: "America/La_Paz",
                }).format(new Date(current.fecha))
              : "Sin fecha de verificación"}
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
      <label className="elite-branch">
        <span className="sr-only">Sucursal</span>
        <select value={branch} onChange={(event) => onBranch(event.target.value)}>
          <option value="todas">Todas las sucursales</option>
          {branches.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nombre}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className="elite-icon-button"
        onClick={onTheme}
        aria-label={`Activar tema ${theme === "dark" ? "claro" : "oscuro"}`}
      >
        {theme === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
      </button>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button type="button" className="elite-user-menu" aria-label="Menú de usuario">
            <UserRound size={18} aria-hidden="true" />
            <span>
              {user.nombre}
              <small>{user.rol}</small>
            </span>
            <ChevronDown size={14} aria-hidden="true" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content className="elite-dropdown" align="end" sideOffset={8}>
            <DropdownMenu.Label>
              {user.nombre} · {user.rol}
            </DropdownMenu.Label>
            <DropdownMenu.Separator />
            <DropdownMenu.Item asChild>
              <Link href="/admin/perfil">
                <UserRound size={16} />
                Mi perfil
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild>
              <Link href="/">
                <ArrowUpRight size={16} />
                Ver sitio público
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => {
                void logoutAction();
              }}
            >
              <LogOut size={16} />
              Cerrar sesión
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </header>
  );
}
