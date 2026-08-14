import { CANONICAL_SCENARIO_IDS, FLEET_SIZE_IDS, RESEARCH_IDS } from "@bluewave/campaign";
import { z } from "zod";

/**
 * ENGINEERING-CONTRACT.md's Electron boundary rule requires IPC requests to
 * be Zod-validated. This validates the payload's wire shape (fields present,
 * correct primitive types, and — for the fixed-catalog fields — one of the
 * known ids) at the process boundary; deeper semantic validation (does this
 * *combination* of scenario/nation/setting actually exist, e.g. is this
 * fleet-size setting supported by this scenario) stays in
 * `@bluewave/campaign`'s `validateCampaignConfiguration` /
 * `createInitialCampaignState`, matching `campaignSaveSchema.ts`'s existing
 * split between wire-shape Zod and domain-code semantics.
 */
export const CampaignConfigurationPayloadSchema = z.object({
  scenarioId: z.enum(CANONICAL_SCENARIO_IDS),
  playerSlotId: z.string().min(1),
  continuityModeId: z.enum(["historical", "alternate_continuity_v1"]),
  fleetSizeSettingId: z.enum(FLEET_SIZE_IDS),
  researchSpeedSettingId: z.enum(RESEARCH_IDS),
  technologyVariationSettingId: z.enum(["none", "some", "considerable"]),
  historicalBudgetOptionId: z.string().min(1),
  legacyFleetModeId: z.string().min(1),
  tacticalRealismModeId: z.string().min(1),
  difficultyProfileId: z.string().min(1),
  campaignSeed: z.string().min(1),
  configurationSchemaVersion: z.string().min(1),
  archetype: z.string().optional(),
});

export const SessionIdPayloadSchema = z.string().min(1);

/**
 * `CommandEnvelope` (`shared/bridge-contract.ts`) — the
 * `{sessionId, expectedRevision, transportRequestId}` triple shared by every
 * optimistic-concurrency command. `commitMonth` (ticket 13) is the first
 * command wired against it; construction/fleet submit/replace/cancel
 * (ticket 10) reuse this same schema when they land.
 */
export const CommandEnvelopePayloadSchema = z.object({
  sessionId: z.string().min(1),
  expectedRevision: z.number().int().nonnegative(),
  transportRequestId: z.string().min(1),
});
