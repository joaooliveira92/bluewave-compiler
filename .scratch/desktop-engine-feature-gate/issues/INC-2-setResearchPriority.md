# INC-2 — `setResearchPriorityCommand` (engine-authoritative issue)

**Type:** task
**Status:** resolved
**Blocked by:** INC-1

## What to build

Second bridge command `setResearchPriorityCommand`:

- Payload `{ sessionId, expectedRevision, transportRequestId,
  fieldPriorities: Record<string, number>, exactTechId?: string }` (Zod
  schema in `campaignCommandSchemas.ts`).
- Handler `setResearchPriorityCommand(payload)` in `researchCommands.ts`:
  verify session (`SESSION_NOT_FOUND`), verify `expectedRevision` against
  `snapshot.turnNumber` (`REVISION_MISMATCH`), then build a real
  `CommandEnvelope<SetResearchPriorityCommand>`:
  - `expectedSnapshotHash = sha256Hex(canonicalSerialize(record.state.snapshot))`
    (exactly the AI generator's value — lifecycle `validate` line 142-143).
  - deterministic idempotency key for the player
    `campaignId/turn/playerSlotId/SetResearchPriority` (AI pattern), freeze
    `fieldPriorities`, `issuersClass: "player"`, `issuerId: playerSlotId`.
  - Store in a new `researchWorkspace.ts` (per-session queue of pending
    envelopes), idempotently (same `transportRequestId` replays, different
    → `IDEMPOTENCY_CONFLICT`).
- `commitMonth.ts`: drain the session's pending research envelopes into
  `executor.execute(snapshot, [...pending], randomSeed, collector)`. The
  engine's command_collection applies them authoritatively. Clear the queue
  after a successful execute; on `MONTH_EXECUTION_FAILED` leave them queued
  (never partially).
- Add name + overload + `campaignBridge` case + schema + canary update.

## Acceptance (spec AC-2..AC-5)

- After issuing + `commitMonth`, `inspectResearchScreen` shows the new field
  priorities (engine-applied), matching `snapshot.nations[player].research.fieldPriorities`.
- Unknown-field / non-integer priority is rejected with ENGINE diagnostics
  (via lifecycle `STALE_SNAPSHOT_HASH` or a stable context code) — session
  untouched.
- `expectedRevision` mismatch returns `REVISION_MISMATCH`.
- Idempotent `transportRequestId` re-issue replays, no double-enqueue.
- Determinism: same seed + same priority → same final `snapshotHash` (two
  child-process runs in the test).

## Validation

`pnpm -w turbo run test --filter=@bluewave/desktop` (new `researchCommands.test.ts`),
plus a two-process determinism assertion inside the test.