import Link from "next/link";
import { Brand } from "@/components/brand/Brand";
import { SiteNav } from "./SiteNav";
import { ThemeToggle } from "./ThemeToggle";
export function SiteHeader() {
  return (
    <header className="site-header shell">
      <Link href="/" className="brand-link" aria-label="ELITEPC · CREAR PC, inicio">
        <Brand />
      </Link>
      <SiteNav />
      <ThemeToggle />
    </header>
  );
}
