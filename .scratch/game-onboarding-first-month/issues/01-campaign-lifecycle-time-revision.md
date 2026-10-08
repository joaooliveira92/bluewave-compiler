**Type:** grilling
**Status:** resolved
**Blocked by:** none

## Question

Spec §4 (Campaign Lifecycle) and §19.2–19.3 (Campaign Revision, Command
Result) of [01-diagnosis.md](../01-diagnosis.md).

Decide the campaign-lifecycle, time, and revision model for Milestone 2:

1. **Campaign status** (§4.1): the doc proposes `commissioning | active |
   resolution_pending | resolution_failed | archived`. Does a campaign-status
   concept already exist from the Commissioning Flow work (check
   `packages/campaign`, `apps/desktop/src/shared/campaign-command-contract.ts`)?
   If so, reconcile against it rather than inventing a parallel one. Confirm
   the `commissioning → active` transition on "Take command" is already
   real (it should be, per the prior map's ticket 07/08) or needs wiring.
2. **Campaign date & turn number** (§4.2–4.3): verify `CampaignDate`
   (year/month) and a turn-number concept already exist in
   `packages/campaign-engine` (this is core simulation state, very likely
   real) — cite what's actually there, adjust the doc's proposed shape only
   if it's genuinely wrong, not just differently named.
3. **Campaign revision** (§19.2): no `campaignRevision` exists yet, but
   `BridgeResult`'s `rejected` outcome already carries `currentRevision` for
   optimistic-concurrency (`apps/desktop/src/shared/bridge-contract.ts`).
   Decide: does Milestone 2 formalize a first-class `campaignRevision`
   field on campaign state (matching the doc's intent — incrementing on
   every state-changing command), or is `currentRevision` as already
   surfaced by `BridgeResult` sufficient and this ticket only needs to
   document its existing semantics? Recommend adopting/formalizing the real
   mechanism rather than introducing new vocabulary, per the map's Notes.
4. **Command result shape** (§19.3): the doc proposes a closed
   `CampaignCommandResult<T>` ok/error union. The real shape is
   `BridgeResult<T>` (3 outcomes: `success` / `rejected` with free-text
   `reason` + optional `currentRevision` / `error` with free-text `reason`).
   Decide whether the spec documents commands in terms of the real
   `BridgeResult` shape (recommended) rather than the doc's invented type.

## Notes for the resolving session

- This ticket blocks [Advance Month flow](./13-advance-month-flow.md) — its
  revision/idempotency decisions depend on what's decided here.
- Don't re-derive whether `commissioning`/Take-command wiring exists —
  dispatch a research subagent to check `apps/desktop` and
  `packages/campaign` directly rather than guessing.

## Answer

Verified against the codebase (research fork, not the diagnosis doc):

1. **Campaign status** — no campaign-level status concept exists anywhere.
   `packages/campaign` has only unrelated per-entity status enums (nation,
   fleet participation, construction order). `CampaignSessionState`
   (`packages/campaign/src/campaignSession.ts:37-45`) has only a binary
   `isTerminal: boolean`. `campaign-command-contract.ts` has no status field.
   "Take command" (`apps/desktop/src/renderer/shell/useNewGameFlow.ts:259-262`)
   is pure UI navigation (`openCampaign`) with zero state mutation — there is
   no status field to flip. **Decision:** the doc's 5-value
   `commissioning|active|resolution_pending|resolution_failed|archived` enum
   is dropped. The spec describes campaign status as a **UI-derived**
   concept — running / resolving / ended — built from `isTerminal` plus
   in-flight-command state the desktop app already tracks, not new engine
   enum work.
2. **CampaignDate & turn number** — real state exists, shaped per-layer.
   `CampaignSessionState` stores flat `currentYear`/`currentMonth`
   (`campaignSession.ts:41-42`); `PlayerProjectionMonth`
   (`packages/campaign-engine/src/projection.ts:44-46`) nests as
   `{month, year}`. `turnNumber: SafeInt` is real, starts at `0`
   (`compiler.ts:287`), increments only in `advanceCampaignMonth`
   (`campaignSession.ts:248`). **Decision:** spec documents the canonical
   `CampaignDate` shape as nested `{year, month}` (matching what the desktop
   app actually reads off `PlayerProjection`), with a one-line note that
   internal session state stores it flat.
3. **Campaign revision** — `PlayerProjection.revision` is literally
   `Number(snapshot.turnNumber)` (`projection.ts:152`) — not a separate
   incrementing-per-command counter — yet `expectedRevision`/
   `currentRevision` optimistic-concurrency is already wired through
   research, diplomacy, construction, and simulation screens (none of which
   advance the turn; `turnNumber` only changes in `advanceCampaignMonth`).
   This means two conflicting same-month edits (e.g. two research-priority
   submissions) would both see the same "current" revision — turnNumber-as-
   revision can't detect same-month conflicts, only stale-month submissions.
   **Decision:** documented as a known-gap callout in the spec, not new work
   commissioned by this ticket — the existing UI wiring already assumes
   finer-grained revisions than `turnNumber` provides; a real per-mutation
   counter is flagged as a small follow-up, not invented from scratch here.
4. **Command result shape** — `BridgeResult<T>`
   (`apps/desktop/src/shared/bridge-contract.ts:34-44`) confirmed as the
   real 3-outcome (`success`/`rejected`/`error`) shape, free-text `reason`
   strings on `rejected`/`error`, optional `currentRevision` on `rejected`.
   Already used across research/diplomacy/construction/simulation screens.
   **Decision:** spec documents all campaign commands in terms of the real
   `BridgeResult` shape, dropping the doc's invented closed
   `CampaignCommandResult<T>` union. `reason` stays free-text — tightening
   into a closed enum is a cross-cutting API-hardening change out of this
   milestone's scope.
