import { requireSession } from "@/lib/auth";
import { apiError, readJson } from "@/lib/api-errors";
import { getBatch, saveBatch } from "@/lib/ia/batch";
import { z } from "zod";
export const maxDuration = 60;
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession("EDITOR");
    return Response.json(
      await getBatch(
        z
          .string()
          .min(1)
          .max(100)
          .parse((await params).id),
        session.user,
      ),
    );
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession("EDITOR");
    return Response.json(
      await saveBatch(
        z
          .string()
          .min(1)
          .max(100)
          .parse((await params).id),
        await readJson(request),
        session.user,
      ),
    );
  } catch (error) {
    return apiError(error);
  }
}
