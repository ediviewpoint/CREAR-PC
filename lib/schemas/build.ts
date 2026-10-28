import { z } from "zod";
import { componentCategory } from "./components";

export const buildPurpose = z.enum([
  "gaming",
  "workstation",
  "office",
  "streaming",
  "editing",
  "ai_ml",
]);

export type BuildPurpose = z.infer<typeof buildPurpose>;

export const targetResolution = z.enum(["1080p", "1440p", "4K"]);
export type TargetResolution = z.infer<typeof targetResolution>;

export const buildItemInput = z.object({
  componentId: z.string().uuid(),
  quantity: z.number().int().positive().max(16).default(1),
  storeId: z.string().uuid().optional(),
  notes: z.string().max(500).optional(),
});

export const addComponentInput = z.object({
  buildId: z.string().uuid().optional(),
  componentId: z.string().uuid(),
  category: componentCategory,
  quantity: z.number().int().positive().max(16).default(1),
});

export const removeComponentInput = z.object({
  buildId: z.string().uuid(),
  buildItemId: z.string().uuid(),
});

export const saveBuildInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(160),
  purpose: buildPurpose.optional(),
  budgetBob: z.number().positive().max(500000).optional(),
  targetResolution: targetResolution.optional(),
  isPublic: z.boolean().default(false),
  items: z.array(buildItemInput).min(0).max(50),
});

export type SaveBuildInput = z.infer<typeof saveBuildInput>;
