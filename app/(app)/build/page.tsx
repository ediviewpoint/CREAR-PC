import type { Metadata } from "next";
import { getCatalog } from "@/lib/catalog/load";
import { BuildWorkbench } from "@/components/build/BuildWorkbench";
export const metadata: Metadata = { title: "Tu mesa de trabajo" };
export default async function BuildPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; component?: string }>;
}) {
  const query = await searchParams;
  return (
    <BuildWorkbench
      catalog={await getCatalog()}
      existing={query.mode === "existing"}
      initialSlug={query.component}
    />
  );
}
