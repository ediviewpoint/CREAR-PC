"use client";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { AdminProviders } from "./Providers";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { GlobalSearch } from "./GlobalSearch";
import { usePreference } from "./usePreference";
import type { UserRole } from "@/lib/auth-permissions";
import type { ExchangeRate } from "@/lib/configuracion";
const BranchContext = createContext("todas");
export function useBranch() {
  return useContext(BranchContext);
}
type Props = {
  children: ReactNode;
  user: { id: string; nombre: string; rol: UserRole };
  branches: { id: string; nombre: string }[];
  rate: ExchangeRate;
};
function Shell({ children, user, branches, rate }: Props) {
  const [sidebar, setSidebar] = usePreference("elitepc.sidebar", "expanded");
  const [theme, setTheme] = usePreference("elitepc.theme", "dark");
  const [branch, setBranch] = usePreference("elitepc.branch", "todas");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    function key(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((previous) => !previous);
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const validBranch =
    branch === "todas" || branches.some((item) => item.id === branch) ? branch : "todas";
  return (
    <BranchContext.Provider value={validBranch}>
      <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <div
          className={`elite-admin ${sidebar === "collapsed" ? "sidebar-collapsed" : ""}`}
          data-theme={theme}
        >
          <Topbar
            user={user}
            branches={branches}
            branch={validBranch}
            onBranch={setBranch}
            theme={theme}
            onTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
            onMenu={() => {
              if (window.matchMedia("(max-width: 767px)").matches) setMobileOpen(true);
              else setSidebar(sidebar === "collapsed" ? "expanded" : "collapsed");
            }}
            onSearch={() => setSearchOpen(true)}
            menuRef={menuRef}
            initialRate={rate}
          />
          <div className="elite-desktop-sidebar">
            <Sidebar collapsed={sidebar === "collapsed"} role={user.rol} />
          </div>
          <main id="main" className="elite-main">
            {children}
          </main>
        </div>
        <Dialog.Portal>
          <div className="elite-drawer-root" data-theme={theme}>
            <Dialog.Overlay className="elite-overlay" />
            <Dialog.Content
              className="elite-sidebar-drawer"
              onCloseAutoFocus={(event) => {
                event.preventDefault();
                menuRef.current?.focus();
              }}
            >
              <Dialog.Title>Menú principal</Dialog.Title>
              <Dialog.Description className="sr-only">
                Módulos de administración ElitePC
              </Dialog.Description>
              <Dialog.Close className="elite-icon-button elite-close" aria-label="Cerrar menú">
                <X />
              </Dialog.Close>
              <Sidebar collapsed={false} role={user.rol} onNavigate={() => setMobileOpen(false)} />
            </Dialog.Content>
          </div>
        </Dialog.Portal>
      </Dialog.Root>
      <GlobalSearch open={searchOpen} onOpen={setSearchOpen} />
    </BranchContext.Provider>
  );
}
export function AppShell(props: Props) {
  return (
    <AdminProviders>
      <Shell {...props} />
    </AdminProviders>
  );
}
