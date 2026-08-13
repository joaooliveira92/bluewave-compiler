# Wayfinder Map: CLI Battle/Gunnery Debug Surface

## Destination

Add a curated set of CLI debug/inspection commands to `apps/compiler-cli` that
drive `@bluewave/combat`'s tactical/gunnery layer (B-1 generation, B-2
movement/spotting, B-3 gunnery) **directly and standalone from phase-engine**
— that layer has zero CLI reach today, and B-6 (real phase-pipeline wiring)
hasn't happened yet. Separately, enrich the CLI's *existing* battle-adjacent
output (`turn:execute`, `replay`), which already runs `generateBattles`/
`BattleResolver` internally but only prints ledger hashes today, not the
battle outcomes/damage reports/generation records already present in
`MonthExecutor`'s result.

## Notes

- **Execution override**: unlike a typical Wayfinder map, tickets here do
  **direct implementation** (add the command, wire it, test it) — not
  spec-then-handoff. Decided during charting: this is additive, low-risk CLI
  surface work, well-precedented by existing patterns in `commands.ts`/
  `main.ts`, so per-ticket implementation beats spec overhead.
- Domain: `apps/compiler-cli` (CLI shell) driving `@bluewave/combat` (pure,
  deterministic engine package). Follow existing CLI conventions: `--json`/
  human output modes via `OutputMode`, `DiagnosticCollector` for
  errors/warnings, exit-category mapping in `main.ts`.
- Do **not** build new orchestration chaining generate → tactical loop →
  gunnery → battle-end — that's B-6's explicit job per the b3-m2-gunnery map
  (`.scratch/b3-m2-gunnery/map.md`). This effort's commands are thin shells
  around *existing* entry points/primitives, run in isolation.
- `advanceMinute` (from `packages/combat/src/simulation/engine.ts`) already
  folds movement + spotting internally — no separate movement/spotting
  commands needed unless debugging reveals otherwise (see Not yet specified).
- Gunnery has no single `resolveGunnery` entry point — only composable
  primitives (`resolveAccuracy`, `isHit`, `resolveHit`,
  `reserveAndConsumeAmmunition`, reload primitives). Bundle the "what happens
  on one shot" subset into one command rather than one command per primitive.
- Combat throws `BluewaveError` (code + context via `@bluewave/contracts`),
  not the CLI's `DiagnosticCollector` convention — every new command needs
  the adapter ticket resolved first.
- This is a **separate track** from `.scratch/engine-suite-roadmap/` (B9
  Electron shell / B10 gameplay milestones) — do not conflate the two.
- v1 accepts hand-authored JSON matching `TacticalBattleState`/
  `MovementState`/`GunneryState` shapes, documented via `--help`; no fixture
  generator in this pass (see Not yet specified).

## Decisions so far

- [BluewaveError → Diagnostic Adapter](issues/01-bluewave-error-diagnostic-adapter.md) — implemented `combatDiagnostics.ts` (`reportBluewaveError`, `runCombatOperation`): `BluewaveError.message` doubles as the collector `code`, `context` folds into `remediation`; `runCombatOperation`'s outcomes (`success`/`validation-error`/`internal-error`) map directly onto `ExitCategory` for easy propagation in the three commands it unblocks.
- [`battle:generate` command](issues/02-battle-generate-command.md) — implemented `runBattleGenerate`, wired as `battle:generate`. Loads a snapshot via `SaveStore`, defaults month/rulesetVersion from the snapshot and rng/formula/content versions to match `phase-engine/src/month.ts` exactly (all overridable), reuses `resolveShipStrength` (newly exported from `@bluewave/phase-engine`) for parity with a real turn. `@bluewave/combat` added as a direct `compiler-cli` dependency. Flags a pre-existing, unrelated `@bluewave/ai` build break that forced building `phase-engine` in non-composite mode.
- [`battle:advance-minute` command](issues/03-battle-advance-minute-command.md) — implemented `runBattleAdvanceMinute`, wired as `battle:advance-minute`. `--state <path>` JSON carries `state`/`orders`/`attackRangeUm`; `--minute`/`--observation-time` are CLI flags so one state file re-runs at different minutes. `engine`/`gunnery` deliberately unsupported (keeps this command to movement/spotting only, per the map's scope). `--help` documents the hand-authored JSON shape since no fixture builder exists anywhere in the repo.
- [`gunnery:resolve-shot` command](issues/04-gunnery-resolve-shot-command.md) — implemented `runGunneryResolveShot`, wired as `gunnery:resolve-shot`. Bundles `resolveAccuracy` → `resolveHit` → `reserveAndConsumeAmmunition` per the ticket's specified order. Input is `GunneryAccuracyFactors`/identity/ammunition, **not** `GunneryState` (the ticket's phrasing pointed at the right package but the actual primitives take narrower shapes). `--seed` is the only CLI flag; `identity` stays nested in the JSON file. Verified against real `GUNNERY_ACCURACY_FACTOR_MISSING`/`GUNNERY_AMMUNITION_UNAVAILABLE` errors, not synthetic ones.
- [Enrich `turn:execute`/`replay` battle output](issues/05-enrich-turn-execute-replay-battle-output.md) — added `extractBattleSummary`/`printBattleSummary`, reading battle data straight off `finalSnapshot.wars.battleManifests`/`wars.battles[].result` (not a separate `MonthResult` field — the data was already there). `ReplayResult` gained a `finalSnapshot` field to enable the same treatment for `replay`, but `runReplay`'s JSON output builds an explicit object rather than dumping `replayResult` wholesale, avoiding a Map-serialization footgun. Surfaced (but did not fix, out of scope) a pre-existing `SaveStore.save` crash — `.scratch/persistence-map-serialization-bug/` — that blocks full save-through-CLI verification of `turn:execute`/`replay` today. **Closes the map.**


## Not yet specified

- Whether `battle:advance-minute` needs a companion fixture-generator command
  once hand-authored JSON proves painful in practice in real debugging use
  (deferred per charting decision on scaffolding cost).
- Whether movement/spotting end up needing dedicated standalone commands
  separate from `battle:advance-minute`, if debugging needs turn out to
  require inspecting those stages independently from the bundled minute-step.

## Out of scope

- New orchestration code chaining generate → tactical loop → gunnery →
  battle-end (full standalone battle runner) — owned by B-6
  (`.scratch/b3-m2-gunnery/map.md`), not this effort.
- Fixture-generation tooling for v1 — hand-authored JSON is acceptable for
  the first cut.
- Golden-hash/determinism CLI tooling — stays in `packages/combat/test/`,
  which already covers regression coverage; this effort is ad hoc
  inspection/debugging, not test infrastructure.
- Anything owned by `.scratch/engine-suite-roadmap/` (B9 Electron desktop
  shell, B10 gameplay milestones) — separate, already-active track.
