import { z } from "zod";
import { clientInfo } from "./proforma";
export const quoteBuildInput = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(1).max(160),
  isPublic: z.boolean().default(false),
  items: z
    .array(
      z.object({
        componentId: z.uuid(),
        owned: z.boolean(),
        quantity: z.number().int().min(1).max(16).default(1),
        offerId: z.uuid().optional(),
      }),
    )
    .min(1)
    .max(30),
});
export const issueQuoteInput = z.object({
  buildId: z.uuid(),
  requestKey: z.uuid(),
  client: clientInfo,
  discountBob: z.number().nonnegative().max(500000).default(0),
  validityDays: z.number().int().min(2).max(30).default(7),
  isPublic: z.boolean().default(false),
});
export type QuoteBuildInput = z.infer<typeof quoteBuildInput>;
