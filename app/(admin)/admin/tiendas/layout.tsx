import { requireAdmin } from "@/lib/auth/admin";
import type { ReactNode } from "react";
export default async function LegacyLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  return children;
}
