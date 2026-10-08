import { CommandLifecycle, type CommandBody, type CommandEnvelope } from "@bluewave/commands";
import { canonicalSerialize, sha256Hex } from "@bluewave/deterministic";
import type { BridgeResult } from "../../shared/bridge-contract.js";
import type { CampaignSessionRecord } from "../campaignSessions.js";
import { deterministicTimestamp, verifyEnvelope } from "./commandEnvelope.js";
import {
  fingerprintOfBody,
  lookupPendingEnvelope,
  queuePendingEnvelope,
} from "../pendingCommands.js";

export { currentRevision, verifyEnvelope, type EnvelopeVerification } from "./commandEnvelope.js";

/**
 * The shared "queue a real engine envelope" flow behind every player command
 * that the engine applies on the next `commitMonth` (diplomacy, divisions).
 *
 * Authority (spec D1): the desktop ONLY queues an envelope through the
 * per-session queue (`pendingCommands.ts`, drained by `commitMonth`); the engine
 * is the sole mutator. Issue-time validity is the ENGINE's own
 * `CommandLifecycle.validate()` — never a hand-mirror — so an invalid request
 * surfaces the engine's stable code + message verbatim and leaves the session
 * and queue untouched. `expectedRevision` is checked against
 * `snapshot.turnNumber` (`REVISION_MISMATCH`), and `transportRequestId` makes
 * the submit idempotent (same id + same body replays, different body conflicts).
 */

const PLAYER_ENVELOPE_VERSION = "0.1.0" as const;

export interface QueuedCommandOutcome<Type extends string> {
  readonly commandId: string;
  readonly bodyType: Type;
  readonly appliedOnNextTurn: true;
}

/**
 * Deterministic envelope. Idempotency identity: campaignId / turn / player slot /
 * command type / command-specific `discriminator`. The discriminator is what keeps
 * two commands of the same type in one turn (different targets) from colliding on
 * the same idempotencyKey and commandId.
 */
export function buildPlayerEnvelope<Body extends CommandBody>(
  record: CampaignSessionRecord,
  body: Body,
  discriminator: string,
): CommandEnvelope<Body> {
  const snapshot = record.state.snapshot;
  const idempotencyKey = [
    encodeURIComponent(snapshot.campaignId),
    String(Number(snapshot.turnNumber)),
    encodeURIComponent(record.playerSlotId),
    body.type,
    encodeURIComponent(discriminator),
  ].join("/");
  const commandId = `player-${sha256Hex(`v0:${idempotencyKey}`).slice(0, 40)}`;

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

export interface PlayerCommandRequest<Body extends CommandBody> {
  readonly sessionId: string;
  readonly expectedRevision: number;
  readonly transportRequestId: string;
  /** Builds the engine body (and its idempotency discriminator) for the session's player. */
  readonly build: (record: CampaignSessionRecord) => {
    readonly body: Body;
    readonly discriminator: string;
  };
}

export async function submitPlayerCommand<Body extends CommandBody>(
  request: PlayerCommandRequest<Body>,
): Promise<BridgeResult<QueuedCommandOutcome<Body["type"]>>> {
  const verified = verifyEnvelope(request.sessionId, request.expectedRevision);
  if (verified.outcome !== "success") return verified;
  const record = verified.record;

  const { body, discriminator } = request.build(record);
  const envelope = buildPlayerEnvelope(record, body, discriminator);
  const outcome: QueuedCommandOutcome<Body["type"]> = {
    commandId: envelope.commandId,
    bodyType: body.type,
    appliedOnNextTurn: true,
  };

  const prior = lookupPendingEnvelope(request.sessionId, request.transportRequestId);
  if (prior) {
    if (prior.payloadFingerprint !== fingerprintOfBody(envelope.body)) {
      return {
        outcome: "rejected",
        reason: "IDEMPOTENCY_CONFLICT",
        diagnostics: [
          `transportRequestId ${request.transportRequestId} was already used by command ${prior.envelope.commandId}`,
        ],
      };
    }
    return {
      outcome: "success",
      value: { ...outcome, commandId: prior.envelope.commandId },
      diagnostics: [],
    };
  }

  // Issue-time validity = the engine's own validator. A non-ok outcome surfaces
  // the engine's code + message verbatim and does NOT queue.
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

  queuePendingEnvelope(request.sessionId, {
    transportRequestId: request.transportRequestId,
    envelope,
    payloadFingerprint: fingerprintOfBody(envelope.body),
  });

  return { outcome: "success", value: outcome, diagnostics: [] };
}
