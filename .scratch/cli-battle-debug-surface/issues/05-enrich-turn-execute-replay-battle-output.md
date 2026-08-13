Type: task
Status: resolved

## Question

`turn:execute` (`apps/compiler-cli/src/commands.ts`'s `runTurnExecute`)
already runs `generateBattles`/`BattleResolver` internally via
`MonthExecutor.execute`, but its printed output (both human and `--json`
modes) only shows ledger hashes (command/event/random/financial) — not
battle outcomes, damage reports, or generation records, even though
`MonthExecutor`'s result already carries this data. Same gap likely applies
to `replay`'s output.

Design and implement:

- Inspect `MonthExecutor`'s `execute` result shape (`packages/phase-engine/
  src/month.ts` and `packages/phase-engine/src/engine.ts`) to find where
  battle generation records and `BattleResult`s (winner/loser, losses,
  `damageReport`, `explanation`) already live on the result object.
- Extend `runTurnExecute`'s human output with a battle summary section when
  battles occurred this turn (generation record count/ids, then per-battle
  outcome: winner, loser, losses, damage report) — omit the section entirely
  when no battles occurred, matching the terse style of the rest of the
  command's output.
- Extend the `--json` output with the same data under a `battles` key (or
  similar), without breaking the existing top-level fields consumers may
  already depend on (this is additive — check existing `test/commands.test.ts`
  assertions on `runTurnExecute`'s JSON shape before changing it).
- Apply the same treatment to `runReplay`'s output if `ReplayVerifier`'s
  result carries equivalent per-battle data — otherwise note in the
  resolution comment why it doesn't apply.
- Update `apps/compiler-cli/test/commands.test.ts` to cover a turn that
  produces at least one battle, asserting the new output fields are present
  and correctly populated.

Unlike tickets 02-04, this ticket doesn't call combat directly with new
error paths (it prints already-existing result data), so it does not depend
on the ticket-01 adapter and can proceed independently.

## Answer

**Key finding**: `MonthExecutor`'s `MonthResult` does *not* carry battle
generation records or `BattleResult`s as separate fields (it's just
`{finalSnapshot, commandLedger, eventLedger, randomLedger, financialLedger,
success}`). Instead, `phase-engine/src/month.ts`'s battle_generation and
battle_resolution phases persist this data straight onto the snapshot:
`finalSnapshot.wars.battleManifests` (generation) and
`finalSnapshot.wars.battles[].result` (resolution — winner/loser/losses/
damageReport/explanation, per `BattleInstance`/`BattleResult` in
`@bluewave/campaign`). So the enrichment reads `result.finalSnapshot.wars`
directly rather than a separate result field.

- **Shared helper**: `extractBattleSummary(snapshot)` in `commands.ts`
  returns `{ manifests, battles } | undefined` (undefined when both arrays
  are empty, so callers omit the section entirely). `printBattleSummary`
  renders it in human mode (generated-manifest count, then per-battle
  winner/loser/losses/damage, or just phase for unresolved battles).
- **`runTurnExecute`**: added `battles` to the JSON output object (additive
  key) and a `printBattleSummary` call after the existing human-mode lines.
- **`runReplay` — the "if it applies" case**: `ReplayVerifier.verify`'s
  `ReplayResult` did *not* expose the replayed `finalSnapshot` at all (only
  hashes/step-matches), even though it's computed internally to derive
  `replayedFinalHash`. Added `finalSnapshot: CampaignSnapshot` to
  `ReplayResult` (`packages/phase-engine/src/replay.ts`) — a small additive
  change, not new orchestration, since the data already existed inside the
  method. **Important deviation from a naive "just spread it in":**
  `runReplay`'s old JSON output was `JSON.stringify(replayResult, null, 2)`
  — dumping the whole object. Doing that with `finalSnapshot` attached would
  (a) silently collapse `finalSnapshot.nations`/`designs`/`designFamilies`
  to `{}` under plain `JSON.stringify` (the same Map-serialization gap
  documented elsewhere in this file — `serializeCampaignSnapshot`'s doc
  comment), and (b) bloat every replay's output with the full snapshot.
  Instead, `runReplay` now builds an explicit JSON object (same existing
  fields, `finalSnapshot` deliberately excluded) plus a `battles` key built
  via the same `extractBattleSummary`/`printBattleSummary` used by
  `turn:execute`. `@bluewave/campaign`'s `BattleManifest` type also had to
  be added to its `index.ts` re-exports (only `BattleInstance` was exported
  before).
- **Also exported** `BattleManifest` from `@bluewave/campaign`'s index,
  needed for the `extractBattleSummary` helper's types.

**Testing note — a pre-existing, unrelated bug blocked full save-through-CLI
verification**: `runTurnExecute`'s save path (`SaveStore.save` after
`serializeCampaignSnapshot`) throws `TypeError: snapshot.nations is not
iterable` on any turn, confirmed via `git stash` to exist identically on
`dev` before this ticket's changes — it's the already-tracked
`.scratch/persistence-map-serialization-bug/` (marked "resolved" in its own
ticket, but the fix apparently didn't fully propagate to
`SaveStore.save`'s actual contract vs. what `commands.ts` pre-converts).
Not fixed here (out of scope for this ticket; flagging for whoever picks
that ticket back up or files a fresh one). Verified the enrichment
correctness a different way instead: ran a real `MonthExecutor.execute`
directly (bypassing the broken save step) with the exact fixture from
`packages/phase-engine/test/battle-generation-phase.test.ts`, confirming
the live `wars.battles`/`wars.battleManifests` shape matches exactly what
`extractBattleSummary`/`printBattleSummary` expect and what the new unit
tests exercise.

**Tests** (`apps/compiler-cli/test/commands.test.ts`, appended to existing
`runTurnExecute`/`runReplay` describe blocks — no new file, since this
ticket only extends existing commands): battle summary present (human +
JSON) for `runTurnExecute` when a battle occurred, absent when none did;
same three cases for `runReplay`, plus a case confirming the JSON output
excludes `finalSnapshot` entirely, and a case confirming `runReplay`
degrades gracefully (`undefined` battles, no crash) when a mocked
`ReplayVerifier.verify` result omits `finalSnapshot` (i.e. doesn't assume
every caller has been updated). Full `compiler-cli` suite (95 tests),
`@bluewave/campaign` (100 tests), `@bluewave/phase-engine` (88 tests),
typecheck, and lint all pass.

**This closes the CLI Battle/Gunnery Debug Surface map** — all five
tickets resolved.
