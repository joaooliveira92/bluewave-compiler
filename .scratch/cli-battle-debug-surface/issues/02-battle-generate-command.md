Type: task
Status: resolved

Blocked by: 01

## Question

Add a standalone `battle:generate` command to `apps/compiler-cli` that runs
`generateBattles` (from `@bluewave/combat`) in isolation, without running a
full turn — useful for debugging generation logic (mission-opportunity
detection, eligibility, reachability, manifest hashing) without economy/
research/diplomacy noise from the rest of `turn:execute`.

Design and implement:

- Input: a `CampaignSnapshot` (reuse the existing load path used by
  `campaign:load`/`turn:execute`, e.g. via `SaveStore`) plus the other
  `BattleGenerationInputs` fields (`campaignMonth`, `campaignSeed`,
  `rngVersion`, `formulaVersion`, `rulesetVersion`, `contentVersion`) as CLI
  flags with sensible defaults matching what `phase-engine/src/month.ts`
  passes today. Note `generateBattles` also needs resolver callbacks
  (`resolveStrength`, `resolveShipType`, `resolveReadiness`) — check how
  `month.ts` supplies these and reuse/import the same implementations rather
  than re-deriving them.
- Output (human + `--json`): print `BattleGenerationResult` — `records`
  (with each stage's `outputHash`), `manifests`, `battleIds`, `rejections`.
  Human mode should read like the existing `turn:execute` summaries (labeled
  fields), `--json` should emit the structured result.
- Error handling: use the adapter from ticket 01 for any `BluewaveError`
  thrown during generation.
- Wire into `main.ts`: add to `USAGE`, the command list, and the switch
  statement, following the existing `campaign:*` naming convention.
- Add CLI-level tests following the pattern in
  `apps/compiler-cli/test/commands.test.ts` / `test/cli.test.ts`, using the
  existing combat test fixtures (`packages/combat/test/fixtures/
  generation-fixture.ts`'s `defaultTwoNationFixture()`) as the input snapshot
  where practical, or an equivalent minimal snapshot built the same way.

## Answer

Implemented `runBattleGenerate` in `apps/compiler-cli/src/commands.ts`, wired
into `main.ts` as `battle:generate`, exported from `index.ts`.

- **Input**: loads a `CampaignSnapshot` via `SaveStore.load(saveDir, ...)`
  (same path as `campaign:load`/`turn:execute`). `campaignMonth` defaults to
  `String(snapshot.turnNumber)` and `rulesetVersion` defaults to
  `snapshot.rulesetVersion` — both overridable via `--campaign-month`/
  `--ruleset-version`. `rngVersion`/`formulaVersion`/`contentVersion` default
  to `"1"`/`"1"`/`"0.1.0"`, matching `phase-engine/src/month.ts`'s
  battle_generation phase exactly (overridable too). The resolver callbacks
  reuse `resolveShipStrength` — **exported from `@bluewave/phase-engine`**
  for this purpose (it was a private function in `month.ts`, promoted to a
  named export) — plus the same `resolveShipType`/`resolveReadiness` stub
  constants `month.ts` uses today (`() => "BB"`, `() => 80`); this was a
  deliberate parity choice so `battle:generate`'s output matches what a real
  turn would produce for the same snapshot/month, not a re-derived
  approximation. `@bluewave/combat` was added as a `compiler-cli` dependency
  and tsconfig project reference (previously combat was reachable only
  transitively through `phase-engine`).
- **Output**: human mode prints a summary (record/battle counts, one line
  per generated battle with attacker/defender/area/manifestHash, and any
  rejected opportunity ids); `--json` emits the full `BattleGenerationResult`
  verbatim.
- **Errors**: routed through ticket 01's `runCombatOperation`/
  `reportBluewaveError` adapter.
- **Tests**: `apps/compiler-cli/test/battleGenerate.test.ts` — mocks only
  `SaveStore.load` (not `@bluewave/combat`, so `generateBattles` runs for
  real) against a self-contained two-nation/one-war fixture (ships given
  firepower 300 each so eligible-asset strength clears the
  `FLEET_BATTLE_MIN_STRENGTH`/`CRUISER_BATTLE_MIN_STRENGTH` thresholds and an
  actual battle is generated, not just a rejection). Covers: validation-error
  on missing save, human-mode summary content, `--json` structural/value
  assertions, and explicit `--campaign-month`/`--ruleset-version` overrides
  vs. snapshot defaults. Verified end-to-end outside the test suite too: a
  real save written via `SaveStore.save` and loaded through the compiled
  `dist/main.js battle:generate` binary in both human and `--json` modes,
  confirming the full CLI wiring (arg parsing → `SaveStore` →
  `generateBattles` → diagnostics/output printing → exit code) works
  end-to-end, not just through mocked unit tests.

Full `compiler-cli` suite (73 tests across 5 files), typecheck, and lint all
pass. Note: `phase-engine`'s composite build (`tsc -b`) is currently broken
by a **pre-existing, unrelated** type error in `@bluewave/ai`'s
`aiPlanner.ts:280` (confirmed present on `dev` before this ticket's changes,
via `git stash`). Worked around it here by compiling `phase-engine` directly
(`tsc -p packages/phase-engine/tsconfig.json`, non-`-b` mode, which reads
already-built dependency `.d.ts` files instead of rebuilding the whole
reference graph) to refresh its `dist/` declarations for
`resolveShipStrength`. That `@bluewave/ai` error is out of scope for this
map and not touched here — flagging in case it blocks a future ticket's
build too.
