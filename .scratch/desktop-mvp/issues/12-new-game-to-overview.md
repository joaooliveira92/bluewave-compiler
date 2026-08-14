# 12 — New Game → Overview

**What to build:** `listNewGameOptions`, `compileCampaign`, and
`inspectCampaign` implemented for real against `@bluewave/campaign`
(`CampaignCompiler`, `createInitialCampaignState`) and `@bluewave/persistence`
(`SaveStore`), per [New-Game & Continuity Contract](08-new-game-continuity-contract.md).
Includes fixing `SaveStore.save`'s Map-serialization bug (this is the first
slice that writes a real save) and excluding zero-content nations from
`supportedValues.playerSlotId` per
[Empty-Nation Content Gap](06-empty-nation-content-gap.md).

**Blocked by:** [Bridge Scaffold & Entry-Point Cutover](11-bridge-scaffold-entry-point-cutover.md).

- [x] New Game flow (preferences → archetype → nation) runs against real
      `content/production/1880` data.
- [x] Spain (and the 4 other zero-design/zero-construction nations) do not
      appear in nation selection.
- [x] Completing New Game compiles a real campaign, writes an initial save
      package to disk, and lands on Overview.
- [x] Overview shows real treasury, fleet count, known technologies, ports,
      and strategic areas for the compiled campaign — not placeholder data.
- [x] A save written by `compileCampaign` round-trips through `SaveStore.load`
      with `nations`/`designs`/`designFamilies` intact (proves the Map-bug
      fix).

## Note on scope discovered during implementation

- **`SaveStore.save`'s Map-serialization bug was already fixed** (commit
  `d72438c`, before this ticket started) — `toStorableSnapshot`/
  `fromStorableSnapshot` in `packages/persistence/src/snapshotSerialization.ts`
  already convert `nations`/`designs`/`designFamilies`/`activeCandidates` to
  plain Records and back. This ticket's job for that acceptance item was to
  *prove* the fix with a real round-trip test against the production pack
  (`apps/desktop/src/main/commands/compileCampaign.test.ts`), not to write
  the fix itself.
- **A second, real hash mismatch was found and fixed at the call site**
  (not a scope item the ticket named, but blocking): `CampaignCompiler.compile()`
  computes `state.rawHash` over `snapshot` alone, while `SaveStore.save`/`load`
  verify a hash computed over the whole state (`{snapshot, envelope}`). The
  two never agreed, so saving the compiler's own `rawHash` as-is fails
  `SaveStore.load`'s integrity check on every campaign compiled this way.
  `packages/cross-process-test/src/run-child.ts` — the one proven
  compile→advance→save/load loop in the repo — already works around this by
  recomputing `rawHash` immediately before `store.save()`. `compileCampaign`
  (`apps/desktop/src/main/commands/compileCampaign.ts`'s `toSaveableState`)
  now does the same, rather than inventing a new hashing convention or
  patching the compiler's core hashing (a broader, ADR-threshold change out
  of this ticket's scope).
- **`CampaignSessionState` vs `CampaignState` reconciliation**: both are used
  together, not one instead of the other. `createInitialCampaignState`
  validates the full `CampaignConfiguration` against `CANONICAL_SCENARIOS`
  and supplies session bookkeeping (`currentYear`/`currentMonth`/`turnNumber`)
  for `PlayerProjection.month` — cheap, and sufficient DESIGN-03 precondition
  coverage on its own. `CampaignCompiler.compile()` builds the actual
  compiled `CampaignState` (nations/fleets/designs/etc.) from the content
  pack's YAML. `campaignConfiguration` is deliberately **not** threaded into
  `compiler.compile()`'s `campaignConfiguration` input: that input triggers a
  stricter gate requiring the full canonical scenario/fleet-size/research-speed
  catalogs to be supplied alongside it, but nothing in the compiler actually
  *consumes* `campaignConfiguration` to shape the compiled snapshot (it's a
  precondition gate, not a snapshot-construction input) — `run-child.ts`
  compiles without it too. Threading it through would add validation
  overhead with no corresponding effect on output.
- **Save-location dialog**: reused the retired `project:open`/`project:new`
  handlers' pattern (`const { dialog } = await import("electron")`, found in
  git history at commit `a8fae5a`) via `dialog.showSaveDialog`, injected as
  `CompileCampaignDeps.chooseSaveDirectory` so `compileCampaign`'s own logic
  stays testable without an Electron runtime. No IPC channel changes —
  `campaign:execute` stays the only channel, matching `boundary.test.ts`'s
  allow-list assertions.
- **`NewGameOptions.scenarios`**: lists only `scen_1880` (the one canonical
  scenario `content/production/1880` actually backs), not all five canonical
  scenario ids — listing scenarios with no compiled content behind them would
  misrepresent what's actually playable. `supportedValues.scenarioId` follows
  suit for the same reason (ticket 07 said "derived from `CANONICAL_SCENARIO_IDS`";
  narrowed here to the one id this content pack supports).
- **`NewGameNation.regimeName`/`regimeType`**: not present on the compiled
  `NationState`/`CampaignSnapshot` at all — sourced instead from the
  validated content `pack.nations[].regime.politicalSystem` now exposed on
  `CampaignCompilerOutput.pack` (small, additive change to
  `packages/campaign/src/compiler.ts`, safe per no existing full-object
  equality test on the compiler's return value).
- **`PlayerProjection.economy.shipyardCapacity`**: no "shipyard capacity"
  concept exists anywhere in the engine yet. Used the nation's own ports'
  authored `level` (summed) as the closest real, non-fabricated proxy —
  documented in `packages/campaign-engine/src/projection.ts`'s
  `buildPlayerProjection` doc comment as a judgment call, not treated as
  settled engine semantics.
