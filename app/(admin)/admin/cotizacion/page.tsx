import { requireSession } from "@/lib/auth";
import { CotizacionPanel } from "@/components/productos/CotizacionPanel";
export default async function Quote() {
  await requireSession("VENDEDOR");
  return <CotizacionPanel />;
}
