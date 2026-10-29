import { requireSession } from "@/lib/auth";
import { ConfiguracionPanel } from "@/components/admin/ConfiguracionPanel";
export default async function Config() {
  await requireSession("ADMIN");
  return <ConfiguracionPanel />;
}
