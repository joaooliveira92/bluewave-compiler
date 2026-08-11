import { z } from "zod";

// ── BalanceConstants ────────────────────────────────────────────────

export const BalanceConstantsSchema = z.object({
  openingTreasury: z.number(),
  monthlyAppropriation: z.number(),
  shipyardTotalCapacity: z.number(),
  shipyardReservedCapacity: z.number(),
  shipyardAvailableCapacity: z.number(),
  constructionTotalWork: z.number(),
  constructionMonthlyRate: z.number(),
  constructionMonthlyCost: z.number(),
  institutionalConfidence: z.number(),
  politicalCapital: z.number(),
  optional: z
    .object({
      researchMaxPercent: z.number().optional(),
      researchDiminishingThreshold: z.number().optional(),
      foreignStationObligationPercent: z.number().optional(),
      blockadeThreshold: z.number().optional(),
      canalBlockTension: z.number().optional(),
    })
    .optional(),
});

// ── RulesetPack envelope ───────────────────────────────────────────

export const RulesetPackSchema = z.object({
  id: z.string(),
  version: z.string(),
  contentHash: z.string(),
  formulaVersion: z.string(),
  rngAlgorithmVersion: z.string(),
  aiPolicyVersion: z.string(),
  provenance: z.literal("RULESET_CONSTANT"),
  balanceConstants: BalanceConstantsSchema,
});

// ── Inferred types ──────────────────────────────────────────────────

export type BalanceConstants = z.infer<typeof BalanceConstantsSchema>;
export type RulesetPack = z.infer<typeof RulesetPackSchema>;
