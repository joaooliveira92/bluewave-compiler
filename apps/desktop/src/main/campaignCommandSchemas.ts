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

/**
 * Wire shape of one of the 5 engine division commands. Shape and size bounds only
 * (`z.string().min(1)`);
 * legality — ship-type compatibility, size by type, same location, ownership — is
 * the ENGINE's own `CommandLifecycle.validate()` at issue time, never a desktop mirror.
 */
export const DivisionCommandBodySchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("CreateDivision"),
    flagshipShipId: z.string().min(1),
    role: z.string().min(1),
    formation: z.string().min(1),
  }),
  z.object({
    type: z.literal("AddShipToDivision"),
    divisionId: z.string().min(1),
    shipId: z.string().min(1),
  }),
  z.object({
    type: z.literal("RemoveShipFromDivision"),
    divisionId: z.string().min(1),
    shipId: z.string().min(1),
  }),
  z.object({
    type: z.literal("ChangeDivisionFlagship"),
    divisionId: z.string().min(1),
    newFlagshipShipId: z.string().min(1),
  }),
  z.object({ type: z.literal("DissolveDivision"), divisionId: z.string().min(1) }),
]);

/** Wire shapes for the fleet movement commands; legality is the engine's (`MoveFleet`). */
export const SubmitMovementCommandPayloadSchema = CommandEnvelopePayloadSchema.extend({
  divisionId: z.string().min(1),
  fromAreaId: z.string(),
  toAreaId: z.string().min(1),
});
export const ReplaceMovementCommandPayloadSchema = SubmitMovementCommandPayloadSchema.extend({
  commandId: z.string().min(1),
});
export const CancelMovementCommandPayloadSchema = CommandEnvelopePayloadSchema.extend({
  commandId: z.string().min(1),
});

/** Wire shape for `submitDesignCommand`; the draft is validated by the engine (`SubmitDesign`) and the ship-design compiler. */
export const SubmitDesignCommandPayloadSchema = CommandEnvelopePayloadSchema.extend({
  className: z.string().trim().min(1).max(60),
  draft: z.custom<Record<string, unknown>>(
    (v) => typeof v === "object" && v !== null,
    "draft must be an object",
  ),
});

/** Wire shape for `reviseProjectCommand`; the engine and the ship-design compiler validate the draft. */
export const ReviseProjectCommandPayloadSchema = CommandEnvelopePayloadSchema.extend({
  projectId: z.string().min(1),
  draft: z.custom<Record<string, unknown>>(
    (v) => typeof v === "object" && v !== null,
    "draft must be an object",
  ),
});

const DraftObjectSchema = z.custom<Record<string, unknown>>(
  (v) => typeof v === "object" && v !== null,
  "draft must be an object",
);

export const LoadShipDraftPayloadSchema = z.object({
  sessionId: z.string().min(1),
  shipId: z.string().min(1),
});

/** Wire shape for `checkRebuild`; the ship-design compiler and the rebuild rules validate the draft. */
export const RebuildCheckPayloadSchema = z.object({
  sessionId: z.string().min(1),
  shipId: z.string().min(1),
  draft: DraftObjectSchema,
});

/** Wire shape for `startRebuildCommand`. */
export const StartRebuildCommandPayloadSchema = CommandEnvelopePayloadSchema.extend({
  shipId: z.string().min(1),
  draft: DraftObjectSchema,
});

export const LoadProjectDraftPayloadSchema = z.object({
  sessionId: z.string().min(1),
  projectId: z.string().min(1),
});

/** Wire shape for `submitBudgetAllocation`; bounds are the engine's own (validated at issue). */
export const SubmitBudgetAllocationPayloadSchema = CommandEnvelopePayloadSchema.extend({
  appropriationRateBp: z.number().int(),
  researchBudget: z.number().int(),
});

/** Wire shape for `submitDivisionCommand`. */
export const SubmitDivisionCommandPayloadSchema = CommandEnvelopePayloadSchema.extend({
  command: DivisionCommandBodySchema,
});

/**
 * Renderer-owned UI-state sidecar (`ui-state.json`, spec §7 Dismissal + §8
 * Persistence). Strict boundary schemas per ENGINEERING-CONTRACT "Content":
 * the `status` is a closed enum, `lastCompletedStep` is a bounded integer in
 * the 7-step (0-indexed) range 0..6, and the fingerprints array is
 * source-size capped (64 entries, each ≤ 256 chars). The wire shape validates
 * at this IPC boundary; the file read tolerantly falls back to empty defaults
 * on any mismatch. Never authoritative.
 */
export const FirstMonthInspectionSchema = z.object({
  status: z.enum(["not_started", "in_progress", "completed", "dismissed"]),
  lastCompletedStep: z.number().int().nonnegative().max(6),
});

/** The full on-disk `ui-state.json` shape (also the read command's result). */
export const UiStateSchema = z.object({
  turnNumber: z.number().int().nonnegative(),
  dismissedFingerprints: z.array(z.string().min(1).max(256)).max(64),
  firstMonthInspection: FirstMonthInspectionSchema.optional(),
});

/**
 * Write-payload wire shape for `writeUiState`. `turnNumber` is intentionally
 * ABSENT: the handler stamps it from the session's current
 * `state.snapshot.turnNumber`, so the sidecar can never be written against a
 * stale turn (expiry stays honest). `firstMonthInspection` is optional and —
 * when absent — carried forward from the stored sidecar (merge semantics,
 * see `WriteUiStatePayload`); an explicit reset sends
 * `{ status: "not_started", lastCompletedStep: 0 }`. Deeper checks (session
 * exists, save dir writable) live in `uiState.ts`, matching the
 * wire-shape/semantics split.
 */
export const WriteUiStatePayloadSchema = z.object({
  sessionId: z.string().min(1),
  dismissedFingerprints: z.array(z.string().min(1).max(256)).max(64),
  firstMonthInspection: FirstMonthInspectionSchema.optional(),
});

/** Tactical Sandbox payloads (debug-only; ADR-0057). */
export const GenerateBattlePayloadSchema = z.object({
  sessionId: z.string().min(1),
  warId: z.string().min(1),
  areaId: z.string().min(1).optional(),
  strengthScale: z.number().int().min(1).max(1000).optional(),
});

export const BattleIdPayloadSchema = z.object({
  sessionId: z.string().min(1),
  battleId: z.string().min(1),
});

export const ResolveTacticalBattlePayloadSchema = BattleIdPayloadSchema.extend({
  turnCount: z.number().int().positive(),
  scriptedOrders: z.array(z.unknown()),
});
