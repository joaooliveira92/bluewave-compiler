import type { CampaignSessionRecord } from "../campaignSessions.js";
import { getCampaignSession } from "../campaignSessions.js";

/**
 * The desktop's shared optimistic-concurrency envelope contract: resolve the
 * session, check `expectedRevision` against the snapshot's `turnNumber`, and
 * expose the deterministic UTC timestamp every player envelope uses.
 *
 * This is the single source for the `REVISION_MISMATCH` / `SESSION_NOT_FOUND`
 * posture shared by every command module (construction, research, fleet, and
 * the queued player commands in `playerCommandSupport.ts`).
 */
export type EnvelopeVerification =
  | { outcome: "success"; record: CampaignSessionRecord }
  | {
      outcome: "rejected";
      reason: string;
      diagnostics: readonly string[];
      currentRevision?: number;
    }
  | { outcome: "error"; reason: string; diagnostics: readonly string[] };

export function currentRevision(record: CampaignSessionRecord): number {
  return Number(record.state.snapshot.turnNumber);
}

export function verifyEnvelope(sessionId: string, expectedRevision: number): EnvelopeVerification {
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

/** Pure integer arithmetic (UTC), identical to `AiCommandGenerator`'s
 * deterministic timestamp: turn 0 → 1910-01-01T00:00:00.000Z, one day per
 * turn number (no wall clock, no locale). */
export function deterministicTimestamp(record: CampaignSessionRecord): string {
  const daysOffset = ((Number(record.state.snapshot.turnNumber) % 365) + 365) % 365;
  const ms = Date.UTC(1910, 0, 1) + daysOffset * 24 * 60 * 60 * 1000;
  return new Date(ms).toISOString();
}
