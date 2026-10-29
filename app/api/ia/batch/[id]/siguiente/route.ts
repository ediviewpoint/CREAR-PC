import { requireSession } from "@/lib/auth";
import { apiError } from "@/lib/api-errors";
import { nextBatch } from "@/lib/ia/batch";
import { z } from "zod";
export const maxDuration = 60;
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession("EDITOR");
    return Response.json(
      await nextBatch(
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
