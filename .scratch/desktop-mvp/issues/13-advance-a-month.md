# 13 — Advance a Month

Status: resolved

**What to build:** `commitMonth` wired to `MonthExecutor`
(`packages/phase-engine/src/month.ts`), with any triggered battle
auto-resolved inline via `packages/combat/src/autoResolution.ts`, per
[Simulation Contract](09-simulation-contract.md). No
`generateBattle`/`resolveBattle`/`resolveTacticalBattle` round-trip for
this slice.

**Blocked by:** [New Game → Overview](12-new-game-to-overview.md).

- [x] From an open campaign, advancing a month on the Simulation screen
      produces a real `MonthReport` (opening/closing treasury, maintenance,
      construction spending) — not placeholder data.
- [x] If the monthly pipeline triggers a battle, the month still completes
      via auto-resolution — the UI never blocks waiting on tactical input.
- [x] Overview reflects the post-commit state (new treasury, turn number)
      after returning from Simulation.
- [x] The month's updated state is persisted (round-trips through save/load).

## Note on scope discovered during implementation

- **The battle auto-resolution integration already existed, fully wired,
  inside `MonthExecutor.execute()` itself** — this reverses this ticket's
  own premise (and ticket 09's) that `commitMonth` would need to separately
  invoke `packages/combat/src/autoResolution.ts`'s `assertAutoResolvable`/
  `AUTO_RESOLUTION_THRESHOLDS` to fold a battle outcome back into the
  snapshot. Reading `packages/phase-engine/src/month.ts` in full (not just
  the ticket's summary of it) turned up two phases neither ticket 09's
  grilling record nor this ticket's brief mentioned: phase 9.5
  (`battle_generation`, gated on `wars.wars` containing an `ACTIVE`/
  `DECLARED_NOT_ACTIVE` war, calling `@bluewave/combat`'s `generateBattles`)
  and phase 10 (`battle_resolution`, calling `@bluewave/combat`'s
  `BattleResolver.resolve()` and folding the result back into the snapshot
  via `month.ts`'s own already-existing `applyBattleResult`, updating war
  score, ship losses, and settling the war on a surrender threshold) — both
  already proven end-to-end by the pre-existing
  `packages/phase-engine/test/battle-generation-phase.test.ts`. So
  `autoResolution.ts`'s exports turned out to be validation guards for the
  statistical auto-resolution *proof* (`generation/autoResolutionProof.ts`,
  used to certify the resolver's accuracy against full tactical
  simulation), not a per-battle gate `commitMonth` needs to call — nothing
  was missing to close here; `commitMonth` only needed to call
  `MonthExecutor.execute()` and map its result. `commitMonth.test.ts`'s
  synthetic-war fixture (mirroring `battle-generation-phase.test.ts`'s
  fixture) proves this integration is real, not just assumed from reading
  the code.
- **A real, previously-latent envelope bug would have broken every
  `commitMonth` save**: `SaveStore.load()` calls
  `verifyEnvelope(state.envelope, state.snapshot)`, which re-hashes the
  snapshot and compares it against `envelope.bodyHash`. `compileCampaign`'s
  saved `envelope` was computed once, at compile time, over the *pre-month*
  snapshot. Reusing that same envelope for the post-month `CampaignState`
  (as a first draft of this command did) passes typecheck and even
  `SaveStore.save()` without error, but fails `SaveStore.load()`'s integrity
  check on every subsequent load, since the envelope's `bodyHash` no longer
  matches the mutated snapshot. Fixed by recomputing the envelope with
  `@bluewave/deterministic`'s `createEnvelope("campaign-snapshot", ...)`
  over the post-month snapshot — same artifact-kind string
  `CampaignCompiler.compile()` already uses, not a new convention. The
  "persists... round-trips through save/load" acceptance item's test would
  have caught this, but it's worth flagging since it's easy to reintroduce
  if `commitMonth` (or a future command touching the snapshot) is refactored
  to reuse an unrelated stale envelope again.
- **A non-ambient per-month random seed needed a new, small piece of state**:
  `MonthExecutor.execute()` takes an explicit `randomSeed: string`, and
  nothing in the previously-compiled `CampaignState`/`CampaignSnapshot`
  carries the player's original `CampaignConfiguration.campaignSeed` (it's
  validated at `compileCampaign` time but never threaded into the compiled
  snapshot, and `CampaignSnapshot.campaignId` is derived from the content
  pack's name alone, not the playthrough, so it collides across different
  campaigns of the same pack). Added `campaignSeed` to
  `CampaignSessionRecord` (`campaignSessions.ts`), populated by
  `compileCampaign` from the configuration it already validates, so
  `commitMonth` can derive each month's seed as
  `` `${campaignSeed}:month:${turnNumber}` `` — domain-separated, reproducible
  from persisted data alone, no wall-clock/`Math.random()` per
  ENGINEERING-CONTRACT's Determinism section. This is a small, additive
  change to a ticket-12 file; `inspectCampaign.test.ts`'s one manual
  `registerCampaignSession` call was updated to include the new required
  field.
- **`MonthExecutor.execute()` does not itself advance `turnNumber` or the
  calendar month/year** — that's left to the caller (confirmed via
  `packages/cross-process-test/src/run-child.ts` and
  `production-pack-loop.test.ts`, neither of which loop it, and by reading
  `execute()`'s body directly: it reads `snapshot.turnNumber` as a label for
  the month being executed but never writes a new one to `finalSnapshot`).
  `commitMonth` increments `turnNumber` by one and advances the session's
  `{month, year}` via `@bluewave/campaign`'s existing `advanceMonth`
  (`packages/campaign/src/timeline.ts`) after `execute()` returns, and
  rejects with `SIMULATION_END_REACHED` via the same package's `canAdvance`
  before attempting to execute past December 1970 — reusing the campaign
  package's own calendar arithmetic rather than re-deriving it.
- **`MonthReport.month` reports the month that was just completed** (the
  session's pre-commit `{month, year}`), while `closingSnapshot.month`/
  `closingSnapshot.revision` report the *new* current month/turn number
  going forward — both are real fields on the response, this is a naming
  disambiguation, not a placeholder. `TurnReportTab.tsx` renders
  `report.month`, and `useSimulationScreen.ts`'s `handleAdvanceTurn` already
  reads `closingSnapshot.month`/`.revision` to update its own local state
  for the *next* `commitMonth` call's `expectedRevision` — the two fields
  serving two different real purposes, not duplication.
- **`expectedRevision`/optimistic concurrency**: this is the first command
  wired against `shared/bridge-contract.ts`'s `CommandEnvelope`
  (`{sessionId, expectedRevision, transportRequestId}`) triple; ticket 10's
  construction/fleet commands (not yet implemented) will reuse the same
  `CommandEnvelopePayloadSchema` added to `campaignCommandSchemas.ts`.
  `expectedRevision` is checked against `CampaignSnapshot.turnNumber`
  (ticket 08 already established `activeRevision` = `turnNumber` renamed);
  a mismatch returns `{outcome: "rejected", reason: "REVISION_MISMATCH",
  currentRevision}` without touching the session or writing a save.
- **Small pre-existing renderer bug fixed in passing**:
  `useSimulationScreen.ts`'s `loadSnapshotData` called
  `inspectConstructionScreen` (ticket 10's still-unimplemented stub) to
  bootstrap `revision`/`month` before the first `commitMonth` call. Against
  a freshly compiled campaign this coincidentally worked (both default to
  revision 0), but would silently send a wrong `expectedRevision` for a
  campaign reopened from a save partway through — directly undermining this
  ticket's own "advancing a month on the Simulation screen" acceptance item
  for that case. Changed to call the real, already-implemented
  `inspectCampaign` instead.
- **Two new direct dependencies on `apps/desktop/package.json`**:
  `@bluewave/events` and `@bluewave/random`. Both were already transitive
  dependencies (via `@bluewave/phase-engine`/`@bluewave/combat`); adding them
  directly lets `commitMonth.ts` import their real `DomainEventEnvelope`/
  `DomainEventBody`/`RandomDecision` types instead of hand-duplicating
  shadow types that could drift from the authoritative definitions.
- **Extracted `toSaveableState`** (the `rawHash`-recomputation helper ticket
  12's `compileCampaign.ts` introduced) to `apps/desktop/src/main/saveHelpers.ts`,
  since `commitMonth` needs the identical logic; `compileCampaign.ts` now
  imports it instead of keeping its own copy.
- **Not fixed, out of scope**: 7 pre-existing `apps/desktop/src/renderer/**/*.test.tsx`
  component tests fail to resolve their sibling component's compiled
  `dist/**/*.jsx` output under its `.js`-suffixed import specifier, whenever
  `dist/` is rebuilt fully from a clean state — a latent, pre-existing
  mismatch between `tsconfig.web.json`'s `"jsx": "preserve"` emit and the
  `.js`-extension import convention used throughout the renderer, unrelated
  to this ticket (none of the affected files touch simulation/campaign
  code, and every renderer file this ticket *did* touch is a `.ts`, not
  `.tsx`, file). Confirmed pre-existing and systemic, not something this
  ticket's diff introduced: it reproduces for all 7 of the renderer's
  `.test.tsx` files uniformly, including ones far outside this ticket's
  reach (e.g. `tactical-sandbox/sandbox/SandboxProvider.test.tsx`).
