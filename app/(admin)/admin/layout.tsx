import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getExchangeRate } from "@/lib/configuracion";
import { AppShell } from "@/components/admin/AppShell";
export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  const [branches, rate] = await Promise.all([
    prisma.sucursal.findMany({
      where: { activa: true },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
    getExchangeRate(),
  ]);
  return (
    <AppShell
      user={{ id: session.user.id, nombre: session.user.name || "Usuario", rol: session.user.rol }}
      branches={branches}
      rate={rate}
    >
      {children}
    </AppShell>
  );
}
