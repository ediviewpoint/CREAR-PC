import "server-only";
import { z } from "zod";
import { exampleProforma } from "./example";
import { proformaSchema } from "./types";
import type { ProformaData } from "./types";
import { visitorHash } from "@/lib/auth/visitor";
import { getProformaById } from "@/lib/db/repos/proformas";
import { getBuildById } from "@/lib/db/repos/builds";
async function read(id: string, publicOnly: boolean): Promise<ProformaData | null> {
  if (id === "ejemplo") return exampleProforma;
  if (!z.uuid().safeParse(id).success || !process.env.DATABASE_URL) return null;
  try {
    const record = await getProformaById(id);
    if (!record) return null;
    if (!record.isPublic) {
      if (publicOnly) return null;
      const owner = await visitorHash(),
        build = owner ? await getBuildById(record.buildId) : null;
      if (!owner || build?.ownerTokenHash !== owner) return null;
    }
    const parsed = proformaSchema.safeParse(record.snapshot);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
export async function getPublicProforma(id: string) {
  return read(id, true);
}
export async function getAccessibleProforma(id: string) {
  return read(id, false);
}
export function proformaUrl(id: string) {
  return new URL(
    "/proforma/" + encodeURIComponent(id),
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ).toString();
}
