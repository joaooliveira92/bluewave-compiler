import { CommandLifecycle, type CommandBody, type CommandEnvelope } from "@bluewave/commands";
import { buildDiplomacyScreenProjection } from "@bluewave/campaign-engine";
import { canonicalSerialize, sha256Hex } from "@bluewave/deterministic";
import type { BridgeResult } from "../../shared/bridge-contract.js";
import type {
  DiplomacyCommandBody,
  DiplomacyCommandOutcome,
  DiplomacyScreenProjection,
  SubmitDiplomacyCommandPayload,
} from "../../shared/diplomacy-contract.js";
import type { CampaignSessionRecord } from "../campaignSessions.js";
import { getCampaignSession } from "../campaignSessions.js";
import {
  fingerprintOfBody,
  lookupPendingEnvelope,
  queuePendingEnvelope,
} from "../pendingCommands.js";

/**
 * The Diplomacy & War screen's two bridge commands
 * (desktop-diplomacy-war INC-1/INC-2), following the exact
 * `researchCommands.ts` conventions: session lookup (`SESSION_NOT_FOUND`),
 * `expectedRevision` against `snapshot.turnNumber` (`REVISION_MISMATCH` with
 * the session untouched), deterministic envelope construction, and
 * `transportRequestId` idempotency.
 *
 * Authority (spec D1): the desktop ONLY queues a real engine envelope
 * through the shared per-session command queue (`pendingCommands.ts`, drained
 * by `commitMonth`); the engine (`MonthExecutor` command_collection, order
 * 6.5 diplomacy phase) is the sole mutator of politics/wars/blockades.
 * Issue-time validity is the ENGINE's own `CommandLifecycle.validate()` —
 * never a hand-mirror — so an invalid request surfaces the engine's stable
 * code + message verbatim (e.g. `ALREADY_AT_WAR`, `DECLARE_WAR_INVALID_TARGET`,
 * `BLOCKADE_NOT_AT_WAR`) and leaves the session/queue untouched.
 */
export async function inspectDiplomacyScreen(
  sessionId: string,
): Promise<BridgeResult<DiplomacyScreenProjection>> {
  const record = getCampaignSession(sessionId);
  if (!record) {
    return {
      outcome: "error",
      reason: "SESSION_NOT_FOUND",
      diagnostics: [`No active campaign session ${sessionId}`],
    };
  }

  const projection = buildDiplomacyScreenProjection(
    record.state,
    record.playerSlotId,
    record.month,
  );
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

export async function submitDiplomacyCommand(
  payload: SubmitDiplomacyCommandPayload,
): Promise<BridgeResult<DiplomacyCommandOutcome>> {
  const verified = verifyEnvelope(payload.sessionId, payload.expectedRevision);
  if (verified.outcome !== "success") return verified;
  const record = verified.record;

  // Build the deterministic envelope first: the idempotency comparison then
  // runs on the shared canonical body fingerprint (same queue identity as
  // research — same transportRequestId + same payload replays; different
  // payload conflicts), matching research/construction exactly.
  const envelope = buildDiplomacyEnvelope(record, payload.command);
  const prior = lookupPendingEnvelope(payload.sessionId, payload.transportRequestId);
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
    return {
      outcome: "success",
      value: {
        commandId: prior.envelope.commandId,
        bodyType: payload.command.type,
        appliedOnNextTurn: true,
      },
      diagnostics: [],
    };
  }

  // Issue-time validity = the engine's own validator (spec D1). A non-ok
  // outcome surfaces the engine's code + message verbatim and does NOT queue
  // (session untouched). The engine re-validates at commitMonth anyway.
  const validation = new CommandLifecycle().validate(envelope, record.state.snapshot);
  if (!validation.ok) {
    if (validation.outcome.type === "rejected") {
      return {
        outcome: "rejected",
        reason: validation.outcome.diagnostic.code,
        diagnostics: [validation.outcome.diagnostic.message],
      };
    }
    return {
      outcome: "rejected",
      reason: "COMMAND_REJECTED",
      diagnostics: [`Engine rejected command ${envelope.commandId}`],
    };
  }

  queuePendingEnvelope(payload.sessionId, {
    transportRequestId: payload.transportRequestId,
    envelope,
    payloadFingerprint: fingerprintOfBody(envelope.body),
  });

  return { outcome: "success", value: outcomeFor(envelope), diagnostics: [] };
}

// ---------------------------------------------------------------------------
// envelope construction (deterministic, mirrors the research slice's pattern
// and AiCommandGenerator's scheme: no clock/env/random)
// ---------------------------------------------------------------------------

const PLAYER_ENVELOPE_VERSION = "0.1.0" as const;

function buildDiplomacyEnvelope(
  record: CampaignSessionRecord,
  command: DiplomacyCommandBody,
): CommandEnvelope<Extract<CommandBody, { type: DiplomacyCommandBody["type"] }>> {
  const snapshot = record.state.snapshot;
  // Idempotency identity: campaignId / turn / player slot / command type /
  // command-specific discriminator. The AI scheme keys on type only, which is
  // correct for research (one wholesale priority record per slot/turn) but
  // NOT for diplomacy: two `DeclareWar` commands in one turn (different
  // targets) would otherwise collide on the same idempotencyKey AND commandId
  // (`player-…`), corrupting the audit ledger's per-command identity. The
  // discriminator resolves that ambiguity deterministically.
  const discriminator = discriminatorFor(command);
  const idempotencyKey = [
    encodeURIComponent(snapshot.campaignId),
    String(Number(snapshot.turnNumber)),
    encodeURIComponent(record.playerSlotId),
    command.type,
    encodeURIComponent(discriminator),
  ].join("/");
  const commandId = `player-${sha256Hex(`v0:${idempotencyKey}`).slice(0, 40)}`;

  return {
    commandId,
    version: PLAYER_ENVELOPE_VERSION,
    expectedSnapshotHash: sha256Hex(canonicalSerialize(snapshot)),
    idempotencyKey,
    timestamp: deterministicTimestamp(record),
    body: engineBodyFor(record.playerSlotId, command),
    issuerClass: "PLAYER",
    issuerParticipantId: record.playerSlotId,
  };
}

/** The command-specific part of the idempotency identity — the nontrivial
 * operand (target / partner / war / area). Deterministic, mirrors the body. */
function discriminatorFor(command: DiplomacyCommandBody): string {
  switch (command.type) {
    case "DeclareWar":
      return command.targetNationId;
    case "AcceptPeace":
      return command.warId;
    case "FormAlliance":
    case "BreakAlliance":
    case "FormNonAggressionPact":
    case "BreakNonAggressionPact":
      return command.partnerNationId;
    case "DeclareBlockade":
      return `${command.targetNationId}\u0000${command.areaId}`;
  }
}

/** Maps the wire command onto the engine's own `CommandBody` — `nationId` is
 * always the session's player slot, never on the wire. */
function engineBodyFor(
  playerSlotId: string,
  command: DiplomacyCommandBody,
): Extract<CommandBody, { type: DiplomacyCommandBody["type"] }> {
  switch (command.type) {
    case "DeclareWar":
      return {
        type: "DeclareWar",
        nationId: playerSlotId,
        targetNationId: command.targetNationId,
        ...(command.warGoalsId !== undefined ? { warGoalsId: command.warGoalsId } : {}),
      };
    case "AcceptPeace":
      return { type: "AcceptPeace", nationId: playerSlotId, warId: command.warId };
    case "FormAlliance":
      return {
        type: "FormAlliance",
        nationId: playerSlotId,
        partnerNationId: command.partnerNationId,
      };
    case "BreakAlliance":
      return {
        type: "BreakAlliance",
        nationId: playerSlotId,
        partnerNationId: command.partnerNationId,
      };
    case "FormNonAggressionPact":
      return {
        type: "FormNonAggressionPact",
        nationId: playerSlotId,
        partnerNationId: command.partnerNationId,
      };
    case "BreakNonAggressionPact":
      return {
        type: "BreakNonAggressionPact",
        nationId: playerSlotId,
        partnerNationId: command.partnerNationId,
      };
    case "DeclareBlockade":
      return {
        type: "DeclareBlockade",
        nationId: playerSlotId,
        targetNationId: command.targetNationId,
        areaId: command.areaId,
      };
  }
}

/** Pure integer arithmetic (UTC), identical to `AiCommandGenerator`'s
 * deterministic timestamp: turn 0 → 1910-01-01T00:00:00.000Z, one day per
 * turn number (no wall clock, no locale). */
function deterministicTimestamp(record: CampaignSessionRecord): string {
  const daysOffset = ((Number(record.state.snapshot.turnNumber) % 365) + 365) % 365;
  const ms = Date.UTC(1910, 0, 1) + daysOffset * 24 * 60 * 60 * 1000;
  return new Date(ms).toISOString();
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

type EnvelopeVerification =
  | { outcome: "success"; record: CampaignSessionRecord }
  | {
      outcome: "rejected";
      reason: string;
      diagnostics: readonly string[];
      currentRevision?: number;
    }
  | { outcome: "error"; reason: string; diagnostics: readonly string[] };

function verifyEnvelope(sessionId: string, expectedRevision: number): EnvelopeVerification {
  const record = getCampaignSession(sessionId);
  if (!record) {
    return {
      outcome: "error",
      reason: "SESSION_NOT_FOUND",
      diagnostics: [`No active campaign session ${sessionId}`],
    };
  }
  const current = currentRevision(record);
  if (expectedRevision !== current) {
    return {
      outcome: "rejected",
      reason: "REVISION_MISMATCH",
      diagnostics: [
        `Expected revision ${expectedRevision} but session ${sessionId} is at revision ${current}`,
      ],
      currentRevision: current,
    };
  }
  return { outcome: "success", record };
}

function currentRevision(record: CampaignSessionRecord): number {
  return Number(record.state.snapshot.turnNumber);
}

function outcomeFor(envelope: {
  commandId: string;
  body: Extract<CommandBody, { type: DiplomacyCommandBody["type"] }>;
}): DiplomacyCommandOutcome {
  return {
    commandId: envelope.commandId,
    bodyType: envelope.body.type,
    appliedOnNextTurn: true,
  };
}
