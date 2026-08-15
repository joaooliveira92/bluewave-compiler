import type { CampaignSnapshot } from "@bluewave/campaign";
import type { CommandEnvelope, SetResearchPriorityCommand } from "@bluewave/commands";
import { canonicalSerialize, sha256Hex } from "@bluewave/deterministic";

/**
 * Session-scoped queue of pending player research-priority envelopes
 * (desktop-engine-feature-gate INC-2). The desktop never mutates
 * `nation.research` directly; `setResearchPriorityCommand` builds ONE real
 * deterministic `SetResearchPriorityCommand` envelope and queues it here, and
 * the next `commitMonth` hands every queued envelope to
 * `MonthExecutor.execute(snapshot, [...], seed)` where the engine's
 * command_collection phase applies them authoritatively (spec D1).
 *
 * Conventions mirror `constructionWorkspace.ts`:
 * - envelopes are keyed by the client's `transportRequestId`; re-issuing the
 *   same id with the same payload replays the prior outcome (no
 *   double-enqueue), while a different payload under the same id is an
 *   `IDEMPOTENCY_CONFLICT`;
 * - `expectedSnapshotHash` is pinned at issue time to the session snapshot;
 *   at drain time the hash is refreshed against the snapshot the month is
 *   about to execute on, so an interleaved construction command (which
 *   persists a new snapshot) cannot silently stale-out the player's research
 *   instruction — the engine's `validate()` still demands the exact current
 *   hash (lifecycle.ts), and the refreshed envelope satisfies it.
 *
 * The queue is in-memory only (like the construction workspace): on a process
 * restart, un-executed research priorities are lost and the snapshot simply
 * keeps the previous priorities — no durable record exists to reconstruct
 * from (`fieldPriorities` are only rewritten once the engine applies them).
 */
export interface PendingResearchCommand {
  readonly transportRequestId: string;
  readonly envelope: CommandEnvelope<SetResearchPriorityCommand>;
  /** The frozen issue-time payload used for idempotent-replay comparison. */
  readonly fieldPriorities: Readonly<Record<string, number>>;
  readonly exactTechId?: string;
}

const pendingBySession = new Map<string, Map<string, PendingResearchCommand>>();

function pendingFor(sessionId: string): Map<string, PendingResearchCommand> {
  const existing = pendingBySession.get(sessionId);
  if (existing) return existing;
  const created = new Map<string, PendingResearchCommand>();
  pendingBySession.set(sessionId, created);
  return created;
}

export function queueResearchEnvelope(sessionId: string, pending: PendingResearchCommand): void {
  pendingFor(sessionId).set(pending.transportRequestId, pending);
}

export function lookupQueuedResearchCommand(
  sessionId: string,
  transportRequestId: string,
): PendingResearchCommand | undefined {
  return pendingBySession.get(sessionId)?.get(transportRequestId);
}

/**
 * The pending envelopes for `sessionId` in issue order (Map insertion order —
 * deterministic FIFO), with `expectedSnapshotHash` refreshed against the
 * snapshot the month will execute on. Returns `[]` when nothing is queued, so
 * a campaign that never issues research commands behaves byte-identically to
 * today's `[]` (same hashes).
 */
export function researchEnvelopesForExecution(
  sessionId: string,
  snapshot: CampaignSnapshot,
): CommandEnvelope<SetResearchPriorityCommand>[] {
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
export function clearResearchEnvelopes(sessionId: string): void {
  pendingBySession.delete(sessionId);
}

/** Test-only: clears every session's queue so test files don't leak state. */
export function clearResearchWorkspacesForTest(): void {
  pendingBySession.clear();
}
