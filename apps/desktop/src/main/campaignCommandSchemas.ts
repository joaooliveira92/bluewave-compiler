import { CANONICAL_SCENARIO_IDS, FLEET_SIZE_IDS, RESEARCH_IDS } from "@bluewave/campaign";
import { CANONICAL_RESEARCH_FIELD_IDS } from "@bluewave/campaign-engine";
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

/**
 * Wire shapes for the Construction screen commands (ticket 14) — the
 * `CommandEnvelope` triple plus the command-specific fields. Deeper checks
 * (design exists, design belongs to the player, command in flight) live in
 * `commands/constructionCommands.ts`, matching the wire-shape/semantics split
 * used everywhere else.
 */
export const ConstructionOrderPayloadSchema = CommandEnvelopePayloadSchema.extend({
  designId: z.string().min(1),
});

export const ReplaceConstructionOrderPayloadSchema = ConstructionOrderPayloadSchema.extend({
  commandId: z.string().min(1),
});

export const CancelConstructionOrderPayloadSchema = CommandEnvelopePayloadSchema.extend({
  commandId: z.string().min(1),
});

/**
 * Wire shape for `setResearchPriorityCommand` (desktop-engine-feature-gate
 * INC-2): the `CommandEnvelope` triple plus strict field priorities. The wire
 * boundary enforces integer values and caps the record at the canonical field
 * set (source-size limit per ENGINEERING-CONTRACT "Security"). Deeper checks
 * (field ids valid, all fields present, every weight in the DESIGN-20 scale,
 * 1..MAX high fields) are a desktop-side mirror of
 * `packages/commands/src/lifecycle.ts`'s `validateSetResearchPriority`, kept
 * in `researchCommands.ts` so invalid input is surfaced with the engine's own
 * stable code (`RESEARCH_PRIORITY_CONSTRAINT_VIOLATED`) — see spec D4. (The
 * engine itself does not reject unknown field keys; the desktop mirror is
 * intentionally stricter, recorded in the feature-gate ticket trail.)
 */
export const SetResearchPriorityCommandPayloadSchema = CommandEnvelopePayloadSchema.extend({
  fieldPriorities: z
    .record(z.string().min(1), z.number().int().nonnegative())
    .refine(
      (record) => Object.keys(record).length <= CANONICAL_RESEARCH_FIELD_IDS.length,
      "fieldPriorities cannot exceed the canonical research field set",
    ),
  exactTechId: z.string().min(1).optional(),
});

/**
 * Wire shape of one of the 7 B10c diplomacy command bodies
 * (desktop-diplomacy-war INC-2). `nationId` is intentionally absent — it is
 * always the session's player slot, filled in by the handler. Deeper checks
 * (target exists, not already at war, …) are the ENGINE's own
 * `CommandLifecycle.validate()` at issue time — never a desktop mirror (spec
 * D1/D2).
 */
export const DiplomacyCommandBodySchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("DeclareWar"),
    targetNationId: z.string().min(1),
    warGoalsId: z.string().min(1).optional(),
  }),
  z.object({ type: z.literal("AcceptPeace"), warId: z.string().min(1) }),
  z.object({ type: z.literal("FormAlliance"), partnerNationId: z.string().min(1) }),
  z.object({ type: z.literal("BreakAlliance"), partnerNationId: z.string().min(1) }),
  z.object({
    type: z.literal("FormNonAggressionPact"),
    partnerNationId: z.string().min(1),
  }),
  z.object({
    type: z.literal("BreakNonAggressionPact"),
    partnerNationId: z.string().min(1),
  }),
  z.object({
    type: z.literal("DeclareBlockade"),
    targetNationId: z.string().min(1),
    areaId: z.string().min(1),
  }),
]);

/** Wire shape for `submitDiplomacyCommand` — the `CommandEnvelope` triple plus
 * the discriminated command body. */
export const SubmitDiplomacyCommandPayloadSchema = CommandEnvelopePayloadSchema.extend({
  command: DiplomacyCommandBodySchema,
});
