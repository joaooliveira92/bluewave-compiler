import type { CampaignSnapshot } from "@bluewave/campaign";
import type { CommandBody, CommandEnvelope } from "@bluewave/commands";
import { canonicalSerialize, sha256Hex } from "@bluewave/deterministic";

/**
 * Session-scoped queue of pending player command envelopes
 * (desktop-diplomacy-war INC-2). The desktop never mutates authoritative
 * snapshot state directly; every command family (research priorities,
 * diplomacy, future families) builds ONE real deterministic engine envelope
 * and queues it here, and the next `commitMonth` hands EVERY queued envelope
 * to `MonthExecutor.execute(snapshot, [...], seed)` where the engine's
 * command_collection phase applies them authoritatively (spec D1).
 *
 * Generalizes the research slice's `researchWorkspace.ts` (which is now a
 * thin facade over this module) so research + diplomacy share one drain seam.
 *
 * Conventions (identical to the research/construction slice):
 * - envelopes are keyed by the client's `transportRequestId`; re-issuing the
 *   same id with the same payload (same canonical body fingerprint) replays
 *   the prior outcome (no double-enqueue), while a different payload under
 *   the same id is an `IDEMPOTENCY_CONFLICT`;
 * - `expectedSnapshotHash` is pinned at issue time to the session snapshot;
 *   at drain time the hash is refreshed against the snapshot the month is
 *   about to execute on, so an interleaved persist (e.g. construction) cannot
 *   silently stale-out a queued command — the engine's `validate()` still
 *   demands the exact current hash (lifecycle.ts), and the refreshed envelope
 *   satisfies it.
 *
 * The queue is in-memory only (like the construction/research workspaces):
 * on a process restart, un-executed commands are lost and the snapshot simply
 * keeps its previous state — no durable record exists to reconstruct from.
 */
export interface PendingCommandEntry {
  readonly transportRequestId: string;
  readonly envelope: CommandEnvelope<CommandBody>;
  /**
   * Deterministic identity of the queued payload — `sha256Hex` over
   * `canonicalSerialize(envelope.body)`. Used by the idempotency comparison
   * (same id + same fingerprint → replay; different payload → conflict) so
   * every command family shares one comparison instead of hand-rolling
   * per-family payload equality.
   */
  readonly payloadFingerprint: string;
}

const pendingBySession = new Map<string, Map<string, PendingCommandEntry>>();

function pendingFor(sessionId: string): Map<string, PendingCommandEntry> {
  const existing = pendingBySession.get(sessionId);
  if (existing) return existing;
  const created = new Map<string, PendingCommandEntry>();
  pendingBySession.set(sessionId, created);
  return created;
}

/** Deterministic fingerprint of an envelope body for idempotency comparison. */
export function fingerprintOfBody(body: CommandBody): string {
  return sha256Hex(canonicalSerialize(body));
}

export function queuePendingEnvelope(sessionId: string, entry: PendingCommandEntry): void {
  pendingFor(sessionId).set(entry.transportRequestId, entry);
}

export function lookupPendingEnvelope(
  sessionId: string,
  transportRequestId: string,
): PendingCommandEntry | undefined {
  return pendingBySession.get(sessionId)?.get(transportRequestId);
}

/**
 * The pending envelopes for `sessionId` in issue order (Map insertion order —
 * deterministic FIFO, regardless of command family), with
 * `expectedSnapshotHash` refreshed against the snapshot the month will
 * execute on. Returns `[]` when nothing is queued, so a campaign that never
 * issues commands behaves byte-identically to the pre-queue pipeline (same
 * hashes).
 */
export function pendingEnvelopesForExecution(
  sessionId: string,
  snapshot: CampaignSnapshot,
): CommandEnvelope<CommandBody>[] {
  const pending = pendingBySession.get(sessionId);
  if (pending === undefined || pending.size === 0) return [];
  const executionHash = sha256Hex(canonicalSerialize(snapshot));
  return [...pending.values()].map((queued) => ({
    ...queued.envelope,
    expectedSnapshotHash: executionHash,
  }));
}

/** Drop every drained envelope for `sessionId` — called by `commitMonth` only
 * AFTER a successful execute + save (never on `MONTH_EXECUTION_FAILED` or
 * `SAVE_FAILED`; those leave the queue intact so a retry re-delivers). */
export function clearPendingEnvelopes(sessionId: string): void {
  pendingBySession.delete(sessionId);
}

/** Remove a single queued envelope by transportRequestId — used to roll back
 * an autosave failure (INC-5: domain command not successful until persistence
 * succeeds). */
export function deletePendingEnvelope(sessionId: string, transportRequestId: string): void {
  const sessionQueue = pendingBySession.get(sessionId);
  if (!sessionQueue) return;
  sessionQueue.delete(transportRequestId);
  if (sessionQueue.size === 0) pendingBySession.delete(sessionId);
}

/** Test-only: clears every session's queue so test files don't leak state. */
export function clearPendingWorkspacesForTest(): void {
  pendingBySession.clear();
}
