import { ownsResource } from "@/lib/auth/ownership";
import { notFound } from "next/navigation";
import { z } from "zod";
import { getBuildWithItems } from "@/lib/db/repos/builds";
import { visitorHash } from "@/lib/auth/visitor";
import { getCatalog } from "@/lib/catalog/load";
import { BuildWorkbench } from "@/components/build/BuildWorkbench";
export const metadata = { title: "Build guardado", robots: { index: false, follow: false } };
export default async function SavedBuild({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const bundle = await getBuildWithItems(id);
  if (!bundle) notFound();
  const own = ownsResource(bundle.build.ownerTokenHash, await visitorHash());
  if (!own && !bundle.build.isPublic) notFound();
  const catalog = await getCatalog(),
    initialSelected = bundle.items.flatMap((i) => {
      const c = catalog.find((c) => c.id === i.componentId);
      return c ? [{ component: c, owned: i.isOwned, quantity: i.quantity }] : [];
    });
  return (
    <BuildWorkbench
      catalog={catalog}
      initialSelected={initialSelected}
      initialId={own ? id : undefined}
      initialName={bundle.build.name}
      initialPublic={own && bundle.build.isPublic}
    />
  );
}
