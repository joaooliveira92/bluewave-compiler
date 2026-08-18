**Type:** grilling
**Status:** resolved
**Blocked by:** 01

## Question

Spec §14 (Advance Month Flow) of [01-diagnosis.md](../01-diagnosis.md).

The real month-orchestration pipeline (`packages/phase-engine`'s
`PhaseRegistry`/`month.ts`) is already far more built than the doc assumes —
and already runs tactical battle generation as part of resolution (map
Notes: report battle outcomes as plain text only, no tactical UI, per the
charting decision). No `AbortSignal` cancellation path exists in the real
command flow; a real idempotency/ledger system already exists in
`packages/commands` (`CommandIdempotencyMap`, `CommandLedger`,
`ReservationManager`, `ScopedIdempotencyStore`, consumed by
`phase-engine/month.ts`).

Decide:

1. **Pre-turn review contents** (§14.2): confirm each listed field is
   derivable from real state at review time (cross-reference
   [Treasury](./06-treasury-budget.md), [Priorities](./04-immediate-priorities-engine.md)).
2. **Blockers vs. warnings** (§14.3): confirm the doc's initial lists match
   what the real phase pipeline can actually detect pre-commit versus only
   discovers mid-resolution.
3. **Resolution request & idempotency** (§14.4): reconcile the doc's
   `AdvanceCampaignMonthCommand` (with its own `requestId`) against the real
   `packages/commands` idempotency machinery and
   [Campaign lifecycle/revision](./01-campaign-lifecycle-time-revision.md)'s
   resolved revision model — decide whether `requestId` is genuinely new or
   whether the real ledger already provides equivalent identity.
4. **Cancellation semantics** (§14.5): since no `AbortSignal` path exists,
   decide whether Milestone 2 builds real mid-resolution cancellation (new,
   nontrivial work) or ships without it — e.g. disable the Advance-Month
   action for the operation's duration instead, deferring true
   cancellation. Recommend the latter unless research surfaces this is
   already trivial to add.
5. **Resolution stages** (§14.6): map the doc's proposed 17-step sequence
   onto the real `PhaseRegistry` phase list — cite the actual phase names
   and order rather than assuming the doc's list is correct.
6. **Transactional requirement & double submission** (§14.7–§14.8): confirm
   atomicity is already handled by `packages/persistence`'s existing
   atomic-replace mechanism (per the map's Notes) — this section may need
   far less new design than the doc implies.

## Notes for the resolving session

- This ticket blocks [Monthly resolution presentation](./14-monthly-resolution-presentation.md)
  and [Monthly Naval Estimates Report](./15-monthly-naval-estimates-report.md)
  — both depend on the real stage list decided here.

## Answer

Verified against the real Advance-Month path end to end: the shell-level
`advanceMonth` (apps/desktop/src/renderer/shell/useCampaignShell.ts:111-150 →
campaign-shell-state.ts `month-commit-*`), the `commitMonth` command
(apps/desktop/src/main/commands/commitMonth.ts), `MonthExecutor.execute`
(packages/phase-engine/src/month.ts) + `PhaseRegistry` (registry.ts), the
`CommandEnvelope`/`BridgeResult` contracts (apps/desktop/src/shared/
bridge-contract.ts), the `SaveStore` atomic save (packages/persistence/src/
store.ts), and the idempotency machinery (packages/commands/src/lifecycle.ts,
apps/desktop/src/main/pendingCommands.ts). Note: `useSimulationScreen.
handleAdvanceTurn` is a **debug-gated** dev screen (ADR-0029); the shell-level
`advanceMonth` is the real M2 campaign flow.

The month pipeline is already fully built and runs tactical battle generation +
resolution as part of resolution (month.ts phases 9.5/10) — the doc's
"no tactical combat this milestone" framing is overridden per the map Notes:
battle outcomes surface as report text only (already real via `BattleOutcome`
in `CommitMonthResponse`). Advance-Month is therefore largely **"document what's
real," not new engine work** — the genuinely new bits are the pre-turn review
UI + the warnings it feeds off (both wait on the priorities engine, ticket 04).

### 1. Pre-turn review contents (§14.2)

Each doc field is derivable from real state at review time:
- **current date** → `record.month` / `PlayerProjection.month`
  (projection.ts:44-46) — real.
- **next date** → `advanceMonth(year, month, 1)` (packages/campaign/src/
  timeline.ts:41-47), the exact helper `commitMonth` already uses — real.
- **available funds** → `PlayerProjection.economy.treasury`
  (projection.ts:154-159) — real.
- **projected monthly surplus/deficit** → **new derived `PlayerProjection.
  economy` fields** decided by ticket 06 (Treasury): `constructionSpend` +
  `researchSpend` via the existing `inspectCampaign` command (they do not exist
  on the projection yet — projection.ts economy is `{treasury,
  monthlyAppropriation, shipyardCapacity}`). `maintenanceCost` is 0 before the
  first `commitMonth` (opening-briefing.ts comment), so the review's projected
  balance = `monthlyAppropriation − maintenanceCost − constructionSpend −
  researchSpend`, all engine-backed once 06 lands. **Spec dependency on 06.**
- **active construction project count** → `nation.constructionProjects` with
  `status !== "COMPLETED"` (real; same predicate the appropriation phase
  filters on, month.ts:520-525) — real.
- **expected completions** → derived from the construction projection (ticket
  09): a project whose `completedWork + this month's cap ≥ totalWork`.
- **current research spending** → `PlayerProjection.economy.researchSpend`
  (to-be-added, 06).
- **unresolved warnings** → the priorities engine (ticket 04, wholly new
  subsystem). **Spec dependency on 04.**
- **save status** → the shell's `saving`/`saveMessage` pair (real, ticket 16).

### 2. Blockers vs. warnings (§14.3)

Real pre-commit blockers — every one already enforced by `commitMonth`:
- **campaign state invalid / stale revision** → `REVISION_MISMATCH` (rejected
  w/ `currentRevision`, commitMonth.ts:62-72) and `SESSION_NOT_FOUND` (53-60).
- **cannot advance** → `SIMULATION_END_REACHED` (74-82).
- **missing player nation** → `UNKNOWN_PLAYER_SLOT` (84-91).
- **another resolution already running** → no server-side lock; the real
  equivalent is the renderer `committing` flag (campaign-shell-state.ts
  `month-commit-started`) that disables the Advance action for the in-flight
  (synchronous) commit. Documented as renderer-side, matching the doc's intent.
- **unsaved command persistence failure** → the pending-envelope queue is
  in-memory only (pendingCommands.ts:29-32); a rejected/failed commit leaves it
  intact, but there is no durable record to *detect* pre-commit — a documented
  limitation (queue is lost on process restart), not a blocker the engine can
  surface in advance.
- **allocation / missing-data domain invariants** → `opening_validation` (phase
  0, month.ts:151-172: NEGATIVE_TREASURY, CONSTRUCTION_OVERFLOW,
  SHIP_IN_MULTIPLE_BATTLES) + the engine's `CommandLifecycle.validate` at
  drain time.

Warnings (§14.3 list: deficit, zero research, no construction, construction
stalls, critical tension, low cash) are **exactly the priorities-engine outputs**
(ticket 04 §7.4 triggers `monthly_deficit`, `low_research_spending`,
`no_active_construction`, `construction_stalled`, `high_foreign_tension`,
`critical_cash_reserve`). The pre-turn review's warning section IS the priority
projection; it cannot be built before 04. No warning-level signal exists in the
engine to read directly yet.

### 3. Resolution request & idempotency (§14.4)

The doc's `AdvanceCampaignMonthCommand` (with its own `requestId`) maps onto
the real **`CommandEnvelope`** triple (bridge-contract.ts:21-25):
`{sessionId, expectedRevision, transportRequestId}` — `requestId` is **not
genuinely new**, it is `transportRequestId`, already Zod-validated at the IPC
boundary (`CommandEnvelopePayloadSchema`, campaignCommandSchemas.ts:41-45) and
already the real `CommitMonthPayload`. Per ticket 01, `expectedRevision` =
`turnNumber` (`PlayerProjection.revision`, projection.ts:152).

**Reconciled double-submit model:** the real protection is (a) the renderer
`committing` flag disabling the action, and (b) `expectedRevision`: a
successful commit advances revision to `closingSnapshot.revision`
(`nextTurnNumber = finalSnapshot.turnNumber + 1`, commitMonth.ts:159-165), so a
second click sends the stale old revision → `REVISION_MISMATCH`. The engine's
`CommandIdempotencyMap`/`CommandLedger` idempotency (lifecycle.ts:1168-1227)
governs the *queued player command envelopes*, keyed by `envelope.idempotencyKey`
— it does NOT cover the month-advance itself. **Gap, recorded:** the doc's
"repeated call with the same `requestId` returns the existing committed result"
(result-caching) is NOT implemented — `useCampaignShell` generates a fresh
`crypto.randomUUID()` per call (useCampaignShell.ts:120) and `commitMonth`
ignores `transportRequestId` beyond the schema. Spec documents the real
revision-based guard + committing flag, and notes same-turn idempotent-replay
caching as a small follow-up (mirroring ticket 01's known-gap pattern) — not
new work commissioned here.

### 4. Cancellation (§14.5)

No `AbortSignal` path exists in the `commitMonth` flow. `SaveStore.save` accepts
an optional `AbortSignal` (store.ts:71) but `commitMonth` does not pass one, and
`MonthExecutor.execute` is fully synchronous. **Decision: M2 ships without
mid-resolution cancellation** — the exact recommendation the ticket anticipated.
`commitMonth` is effectively atomic-and-synchronous once invoked; the Advance
action is disabled via `committing` for the operation's duration, and a
post-success re-click is blocked by the advanced revision. True abort
(`AbortSignal` mid-execution) is deferred — building it would be new, nontrivial
work with no player-visible benefit for a fast synchronous commit. The doc's
"closing the resolution screen does not destroy the session" is already real
(the commit lives in the shell hook, not the screen).

### 5. Resolution stages (§14.6) — the real phase list

The doc's 17-step sequence maps onto the real `PhaseRegistry` order
(registry.ts:11-148) plus the app layer. Date/turn advancement is **not** inside
`MonthExecutor` (it operates on a fixed turn); it happens in `commitMonth` via
`nextSnapshot.turnNumber + 1` and `advanceMonth(month, +1)` — matching ticket
01's model.

| Doc §14.6 step | Real owner |
| --- | --- |
| 1 Validate command + revision | app layer (`REVISION_MISMATCH`, `SESSION_NOT_FOUND`) + phase 0 `opening_validation` |
| 2 Clone/stage working state | `MonthExecutor` `cloneSnapshot` (month.ts:132) |
| 3 Government allocation | phase 1 `monthly_revenue` (treasury income) |
| 4 Mandatory fleet maintenance | phase 4 `maintenance` |
| 5 Apply research expenditure | phase 7 `resolve_research` (spends research budget; reads/writes treasury, registry.ts:109-117) |
| 6 Resolve research progress | phase 7 `resolve_research` |
| 7 Apply construction expenditure | phase 3 `appropriation` |
| 8 Resolve project progress/completions | phase 6 `construction_processing` (completion → fleet ship, month.ts:804-878) |
| 9 Update treasury balance | phases 1/3/4/5 (all write treasury) |
| 10 Resolve diplomacy changes | phase 6.5 `resolve_diplomacy` (war-score/blockade only; **tension changes NOT yet resolved** — `rngAllowed: false`, and monthly tension randomness is owned by ticket 13 per the Diplomacy decision, i.e. a future M2 slice, not this ticket) |
| 11 Rebuild strategic priorities | **not an engine phase** — priorities are the new read-only projection subsystem (ticket 04), app layer |
| 12 Generate monthly report | app layer: `commitMonth` builds `CommitMonthResponse` (report + closingSnapshot) |
| 13 Increment date + turn | app layer: `commitMonth` (`turnNumber+1`, `advanceMonth(+1)`) |
| 14 Validate resulting state | phase 9 `closing_validation` (NEGATIVE_TREASURY, CONSTRUCTION_OVERFLOW, month.ts:1228-1272) |
| 15 Persist atomically | `SaveStore.save` (tmp dir → rename → pointer update, store.ts:113-148) |
| 16 Register committed revision | `registerCampaignSession` (commitMonth.ts:197-201) |
| 17 Return monthly report projection | `CommitMonthResponse` (success value) |

### 6. Transactional requirement & double submission (§14.7–§14.8)

Atomicity is **already handled** by `SaveStore.save` (store.ts): build every
artifact in `.tmp_<id>`, `renameSync(tmpDir, savePath)` as a unit, then update
the pointer via atomic write+rename (updatePointer, store.ts:560-568). A failure
before publication leaves the previous save authoritative and cleans the tmp dir.
`commitMonth`'s ordering guarantees the same from the app side: execute →
rebuild envelope over `nextSnapshot` → `SaveStore.save` → `registerCampaignSession`
→ **then** `clearPendingEnvelopes` (commitMonth.ts:189-208). A `SAVE_FAILED`
return leaves the queue intact (retry re-delivers) and the on-disk pointer
unchanged — the previous state remains the authoritative state. The doc's
"partially updated campaign must never become loadable" is satisfied by the
envelope/hash/signature integrity gates on load (store.ts:357-394). So §14.7 is
"document what's real." §14.8 double submission is covered by the `committing`
flag + revision guard as in §3 above; the doc's same-`requestId` result-replay
is the one recorded gap (see §3).

### Net spec effect

Advance Month is **largely real**: the doc's §14.4–§14.8 reduce to documenting
the existing `commitMonth` + `MonthExecutor` + `SaveStore` pipeline. The M2 spec
should present §14 as (i) the real stage list (the table above), (ii) the
revision + committing-flag double-submit model with the recorded result-caching
gap, (iii) "no mid-resolution cancellation" as the documented decision, and (iv)
the **new** pre-turn review UI whose data comes from the priorities engine
(ticket 04) + the two new `PlayerProjection.economy` derived fields (ticket 06).
Unblocks [Monthly resolution presentation](./14-monthly-resolution-presentation.md)
(stage list for the progress presentation — though note the doc's §15.2
progress-streaming has no real equivalent; see that ticket) and [Monthly Naval
Estimates Report](./15-monthly-naval-estimates-report.md) (its sections map to
the `CommitMonthResponse`/`MonthReport`/ledger surfaces already returned).
