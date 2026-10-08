import type { CommandEnvelope, SetResearchPriorityCommand } from "@bluewave/commands";
import type { SafeInt } from "@bluewave/contracts";
import {
  buildResearchScreenProjection,
  CANONICAL_RESEARCH_FIELD_IDS,
  MAX_HIGH_PRIORITY_FIELDS,
  RESEARCH_FIELD_PRIORITY_WEIGHTS,
} from "@bluewave/campaign-engine";
import { canonicalSerialize, sha256Hex } from "@bluewave/deterministic";
import type {
  ResearchPriorityOutcome,
  ResearchScreenProjection,
  SetResearchPriorityCommandPayload,
} from "../../shared/research-contract.js";
import type { BridgeResult } from "../../shared/bridge-contract.js";
import { SaveStore } from "@bluewave/persistence";
import type { CampaignSessionRecord } from "../campaignSessions.js";
import { getCampaignSession } from "../campaignSessions.js";
import {
  deleteQueuedResearchCommand,
  lookupQueuedResearchCommand,
  queueResearchEnvelope,
  type PendingResearchCommand,
} from "../researchWorkspace.js";
import { fingerprintOfBody } from "../pendingCommands.js";
import { currentRevision, deterministicTimestamp, verifyEnvelope } from "./commandEnvelope.js";

/**
 * The Research & Technology screen's two bridge commands
 * (desktop-engine-feature-gate INC-1/INC-2), following the exact
 * `constructionCommands.ts` conventions: session lookup
 * (`SESSION_NOT_FOUND`), `expectedRevision` against `snapshot.turnNumber`
 * (`REVISION_MISMATCH` with the session untouched), deterministic envelope
 * construction, and `transportRequestId` idempotency.
 *
 * Authority (spec D1): the desktop ONLY queues a real engine envelope. The
 * engine (`MonthExecutor` command_collection via `commitMonth`) is the sole
 * mutator of `nation.research`.
 */
export async function inspectResearchScreen(
  sessionId: string,
): Promise<BridgeResult<ResearchScreenProjection>> {
  const record = getCampaignSession(sessionId);
  if (!record) {
    return {
      outcome: "error",
      reason: "SESSION_NOT_FOUND",
      diagnostics: [`No active campaign session ${sessionId}`],
    };
  }

  const projection = buildResearchScreenProjection(record.state, record.playerSlotId, record.month);
  if (!projection) {
    return {
      outcome: "error",
      reason: "UNKNOWN_PLAYER_SLOT",
      diagnostics: [`No nation ${record.playerSlotId} in session ${sessionId}`],
    };
  }

  return {
    outcome: "success",
    value: { ...projection, revision: currentRevision(record), month: record.month },
    diagnostics: [],
  };
}

export async function setResearchPriorityCommand(
  payload: SetResearchPriorityCommandPayload,
): Promise<BridgeResult<ResearchPriorityOutcome>> {
  const verified = verifyEnvelope(payload.sessionId, payload.expectedRevision);
  if (verified.outcome !== "success") return verified;
  const record = verified.record;

  // Issue-time constraint validation mirroring the engine's
  // `validateSetResearchPriority` (lifecycle.ts) — same stable codes, so
  // INVALID field sets are surfaced as engine diagnostics, never a fabricated
  // desktop message (spec D4). The engine re-validates at commitMonth anyway.
  const violations = validateResearchPriorities(payload.fieldPriorities);
  if (violations.length > 0) {
    return {
      outcome: "rejected",
      reason: "RESEARCH_PRIORITY_CONSTRAINT_VIOLATED",
      diagnostics: violations,
    };
  }

  // `exactTechId` is ALWAYS rejected by the engine lifecycle at drain
  // (`EXACT_TECHNOLOGY_SELECTION_PROHIBITED`, lifecycle.ts), so a command
  // carrying one would queue, then silently fail to apply after the month
  // (the rejected command does not fail the month and the queue is cleared).
  // Reject it at issue with the engine's exact code and keep the session
  // untouched — same stable-code posture as the validations above.
  if (payload.exactTechId !== undefined) {
    return {
      outcome: "rejected",
      reason: "EXACT_TECHNOLOGY_SELECTION_PROHIBITED",
      diagnostics: [`Exact technology selection is prohibited: ${payload.exactTechId}`],
    };
  }

  const frozenPriorities: Readonly<Record<string, number>> = Object.freeze({
    ...payload.fieldPriorities,
  });
  const exactTechId = payload.exactTechId;

  // Build the deterministic envelope first: the idempotency comparison then
  // runs on the shared canonical body fingerprint (pendingCommands.ts), so
  // re-issuing the same transportRequestId with the same payload replays the
  // prior outcome while a different payload under the same id is an
  // IDEMPOTENCY_CONFLICT — the research slice's exact behavior (INC-2
  // generalization; no per-family payload equality anymore).
  const envelope = buildResearchEnvelope(record, frozenPriorities, exactTechId);
  const prior = lookupQueuedResearchCommand(payload.sessionId, payload.transportRequestId);
  if (prior) {
    if (prior.payloadFingerprint !== fingerprintOfBody(envelope.body)) {
      return {
        outcome: "rejected",
        reason: "IDEMPOTENCY_CONFLICT",
        diagnostics: [
          `transportRequestId ${payload.transportRequestId} was already used by command ${prior.envelope.commandId}`,
        ],
      };
    }
    return replayOutcome(prior);
  }

  queueResearchEnvelope(payload.sessionId, {
    transportRequestId: payload.transportRequestId,
    envelope,
  });

  // INC-5 autosave: a successful SetResearchPriority is not successful until
  // its persistence contract succeeds (spec §17). The queued command is
  // in-memory, so we persist the current authoritative state via SaveStore.
  // If the save fails, roll back the queued envelope and surface SAVE_FAILED
  // — no partial in-memory state remains (construction slice pattern).
  const store = new SaveStore();
  try {
    store.save(record.state, record.saveDir);
  } catch (err) {
    deleteQueuedResearchCommand(payload.sessionId, payload.transportRequestId);
    const message = err instanceof Error ? err.message : String(err);
    return { outcome: "error", reason: "SAVE_FAILED", diagnostics: [message] };
  }

  return { outcome: "success", value: outcomeFor(envelope), diagnostics: [] };
}

// ---------------------------------------------------------------------------
// envelope construction (deterministic, mirrors AiCommandGenerator's pattern)
// ---------------------------------------------------------------------------

const PLAYER_ENVELOPE_VERSION = "0.1.0" as const;

function buildResearchEnvelope(
  record: CampaignSessionRecord,
  fieldPriorities: Readonly<Record<string, number>>,
  exactTechId: string | undefined,
): CommandEnvelope<SetResearchPriorityCommand> {
  const snapshot = record.state.snapshot;
  const idempotencyKey = [
    encodeURIComponent(snapshot.campaignId),
    String(Number(snapshot.turnNumber)),
    encodeURIComponent(record.playerSlotId),
    "SetResearchPriority",
  ].join("/");
  // Domain-separated hash over the same key the AI generator uses (ai/v0
  // scheme), with a distinct `player-` prefix so player and AI command ids
  // never collide. The idempotency key itself matches the AI pattern exactly
  // (campaignId/turn/nationId/commandType); the player's nation is never an
  // AI slot, so no cross-issuer key collision is possible.
  const commandId = `player-${sha256Hex(`v0:${idempotencyKey}`).slice(0, 40)}`;

  const priorities: Record<string, SafeInt> = {};
  for (const [field, weight] of Object.entries(fieldPriorities)) {
    assertSafeInteger(weight, field);
    priorities[field] = weight as SafeInt;
  }

  const body: SetResearchPriorityCommand = {
    type: "SetResearchPriority",
    nationId: record.playerSlotId,
    fieldPriorities: Object.freeze(priorities),
  };
  if (exactTechId !== undefined) body.exactTechId = exactTechId;

  return {
    commandId,
    version: PLAYER_ENVELOPE_VERSION,
    expectedSnapshotHash: sha256Hex(canonicalSerialize(snapshot)),
    idempotencyKey,
    timestamp: deterministicTimestamp(record),
    body,
    issuerClass: "PLAYER",
    issuerParticipantId: record.playerSlotId,
  };
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

/** Engine-mirror validation (lifecycle `validateSetResearchPriority`):
 * every canonical field present, each weight in {1,2,4}, highCount 1..MAX,
 * no unknown fields, no non-integer values. Returns diagnostics ([] = valid). */
function validateResearchPriorities(fieldPriorities: Readonly<Record<string, number>>): string[] {
  const diagnostics: string[] = [];
  for (const [field, weight] of Object.entries(fieldPriorities)) {
    if (
      !CANONICAL_RESEARCH_FIELD_IDS.includes(field as (typeof CANONICAL_RESEARCH_FIELD_IDS)[number])
    ) {
      diagnostics.push(`unknown research field "${field}"`);
    }
    if (!Number.isSafeInteger(weight)) {
      diagnostics.push(`non-integer priority ${String(weight)} for field "${field}"`);
    }
  }
  const validWeights = new Set<number>([
    RESEARCH_FIELD_PRIORITY_WEIGHTS.HIGH,
    RESEARCH_FIELD_PRIORITY_WEIGHTS.MEDIUM,
    RESEARCH_FIELD_PRIORITY_WEIGHTS.LOW,
  ]);
  const missing = CANONICAL_RESEARCH_FIELD_IDS.filter(
    (field) => fieldPriorities[field] === undefined,
  );
  const invalidWeight = CANONICAL_RESEARCH_FIELD_IDS.filter(
    (field) =>
      fieldPriorities[field] !== undefined && !validWeights.has(fieldPriorities[field] as number),
  );
  const highCount = CANONICAL_RESEARCH_FIELD_IDS.filter(
    (field) => fieldPriorities[field] === RESEARCH_FIELD_PRIORITY_WEIGHTS.HIGH,
  ).length;
  if (missing.length > 0) diagnostics.push(`missing fields: ${missing.join(",")}`);
  if (invalidWeight.length > 0)
    diagnostics.push(`invalid weight for fields: ${invalidWeight.join(",")}`);
  if (highCount < 1 || highCount > MAX_HIGH_PRIORITY_FIELDS) {
    diagnostics.push(
      `high-priority field count ${String(highCount)} must be in 1..${String(MAX_HIGH_PRIORITY_FIELDS)}`,
    );
  }
  return diagnostics;
}

function assertSafeInteger(value: number, field: string): void {
  if (!Number.isSafeInteger(value)) {
    throw new Error(`fieldPriorities[${field}] must be a safe integer, got ${String(value)}`);
  }
}

function outcomeFor(envelope: {
  commandId: string;
  body: SetResearchPriorityCommand;
}): ResearchPriorityOutcome {
  const priorities: Record<string, number> = {};
  for (const [field, weight] of Object.entries(envelope.body.fieldPriorities)) {
    priorities[field] = Number(weight);
  }
  return { commandId: envelope.commandId, priorities, appliedOnNextTurn: true };
}

function replayOutcome(prior: PendingResearchCommand): BridgeResult<ResearchPriorityOutcome> {
  return { outcome: "success", value: outcomeFor(prior.envelope), diagnostics: [] };
}
