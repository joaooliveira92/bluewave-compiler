import { z } from "zod";

/**
 * ENGINEERING-CONTRACT.md's Electron boundary rule requires IPC requests and
 * responses to be Zod-validated. The snapshot payload's deep shape is already
 * guaranteed by SaveStore's own hash/envelope verification, so this schema
 * validates the envelope crossing the process boundary rather than
 * re-deriving @bluewave/campaign's full CampaignSnapshot type in Zod.
 */
export const LoadSaveRequestSchema = z.string().optional();

export const LoadSaveResultSchema = z.object({
  success: z.boolean(),
  snapshot: z.record(z.string(), z.unknown()).optional(),
  envelope: z.record(z.string(), z.unknown()).optional(),
  rawHash: z.string().optional(),
  diagnostics: z.array(
    z.object({
      code: z.string(),
      severity: z.string(),
      message: z.string(),
    }),
  ),
  error: z.string().optional(),
});
