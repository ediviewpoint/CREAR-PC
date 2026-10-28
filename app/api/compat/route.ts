import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { evaluateBuild } from "@/lib/compat";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import type { BuildView } from "@/lib/compat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const inputSchema = z.object({
  build: z.unknown().transform((v) => v as BuildView),
});

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const limit = rateLimit(clientKey(ip, "compat"), { limit: 60, windowMs: 60_000 });
  if (!limit.success) {
    return NextResponse.json(
      { error: "Demasiadas evaluaciones. Esperá un momento." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Build inválido", details: parsed.error.flatten() }, { status: 400 });
  }
  const report = evaluateBuild(parsed.data.build);
  return NextResponse.json({ report });
}
