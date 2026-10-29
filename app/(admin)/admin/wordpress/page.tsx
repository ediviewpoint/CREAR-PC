import { requireSession } from "@/lib/auth";
import { WordpressPanel } from "@/components/admin/WordpressPanel";
export default async function WordPress() {
  const session = await requireSession("EDITOR");
  return <WordpressPanel admin={session.user.rol === "ADMIN"} />;
}
