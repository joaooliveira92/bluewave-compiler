# B-6 Validation Report — M2 Battle Results → Campaign Integration + M2 Acceptance Gate

> Sprint B-6 (Track B row 6). Implementation via 5 INCs over the orchestrator
> pipeline: wayfinder → spec → implementator → reviewer → validation gate.
> Commits on `dev`: `bf77843` (scoping), `62fba1d` (INC-1),
> `405bace` (INC-2), `1c7b76a` (INC-3). INC-4 components shipped inside
> INC-1/2/3; INC-5 = this gate.

## Scoping

Wayfinder map + 6 decision tickets resolved, research
`docs/research/b6-m2-battle-results.md`, spec (AC-1..14, INC-1..5), brief
`.ai/briefs/b6-m2-battle-results.md`, `.ai/specs/` pointer. Commit `bf77843`.

## What was built (each INC)

- **INC-1 (62fba1d)** — snapshot `startYear/startMonth` + per-area current-month
  `strategicWeather`; authoritative `weather_generation` phase (order 0.5) via
  `defaultClimateProfile_v1` + keyed stream
  `campaign/weather/<areaId>/<monthId>`; `campaignMonthId` calendar ids; compat
  bump 1.0.0→1.1.0 (old saves rejected); goldens regenerated via
  `scripts/regenerate-golden-hashes.cjs` (ADR-0007). ADR-0025.
- **INC-2 (405bace)** — `@bluewave/combat` `resolveBattleAuto`: gunnery→damage
  seam closure (strict no-op `damage` context), tactical projection, weather
  init, minute loop to DESIGN-38 §32 end, `BattleResolutionResult`
  (winner/loser, survivor/sunk, damageReport, eventLedgerHash, minuteHashes,
  resultHash). Contracts `battle_auto_resolution_v1`, reason-code set-equality.
  ADR-0026. Reviewer NEEDS_REWORK (F1..F8) → repaired (hit-zone stream-domain
  separation F1, ledger F2, test locks F3, etc.).
- **INC-3 (1c7b76a)** — `battle_resolution` phase (order 8) wiring: manifest
  battles → `resolveBattleAuto`; decided → UNCHANGED `applyBattleResult`
  (A-3/ADR-0010); tie/time-limit null winner → no war score but full
  consequences; per-ship hp loss + sunk removal + reservation clear;
  manifest-less → M1 `BattleResolver` unchanged; fail-closed diagnostics with
  legacy fallback. `BattleResult.winnerId/loserId` → `string|null`. ADR-0027.
  Reviewer APPROVE + medium/low repaired + missing-test added.

## Orchestrator validation gate (exact commands + observed results)

| Check                                 | Command                                                                 | Result                                                                                                                                                                                                |
| ------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Clean uncached build                  | `pnpm -w turbo run build --force`                                       | 18/18 successful, 0 cached                                                                                                                                                                            |
| Typecheck                             | `pnpm -w exec tsc -b`                                                   | clean (exit 0)                                                                                                                                                                                        |
| Lint                                  | `pnpm lint` (phase-engine, combat, campaign, persistence, compiler-cli) | 0 warnings / 0 errors                                                                                                                                                                                 |
| Format                                | `pnpm -w exec vp fmt --check`                                           | clean (changed files)                                                                                                                                                                                 |
| Full test suite (per package)         | `pnpm vitest run`                                                       | combat 900, campaign 107, phase-engine 108, persistence 26, cross-process 14, content-compiler 14, ai 22, commands 16, events 9, deterministic 11, random 16, contracts 20, diagnostics 7 — all green |
| Golden hashes ×2                      | `node scripts/verify-golden-hashes.cjs`                                 | "All 10 hashes match golden reference" (twice)                                                                                                                                                        |
| Cross-process determinism ×2          | `node packages/cross-process-test/dist/run-child.js` ×2                 | byte-identical                                                                                                                                                                                        |
| Phase determinism                     | `phase-engine/test/battle-resolution-phase.test.ts`                     | two runs → identical closing snapshot + randomLedger hash                                                                                                                                             |
| `BattleResolver`/`StrengthCalculator` | `git diff --stat resolver.ts strength.ts`                               | empty (unmodified)                                                                                                                                                                                    |

Pre-existing, unrelated red suite: `content-schema/test/nation.test.ts` (broken
import of a deleted content corpus); not M2-scoped, tracked separately.

## Golden change (ADR-0007) — INC-1 only

Snapshot gained `startYear/startMonth/strategicWeather` →
`initialSnapshotHash`, `closingSnapshotHash`, `commandLedgerHash`,
`financialLedgerHash`, `randomDecisionLedgerHash` (+8 weather decisions per
fixture area × 3 areas = 24), `replayVerificationHash` changed;
`contentArtifactHash`, `eventLedgerHash`, `battleGenerationHash` unchanged
(content compiler + battle generation untouched, events timestamp by turn).
Regenerated via `scripts/regenerate-golden-hashes.cjs` (atomic, two-run gate),
cause documented. INC-2/3 keep goldens 10/10 (golden fixture has no war →
battle_resolution unexercised).

## Known limitations (recorded, non-blocking)

- DESIGN-38 §34 statistical study → REL-1. Region climate YAML → CONTENT.
  Player tactical UI → UI-track. Crew/officer/political consequences → M3+.
  Smoke + detailed damage control → M3/C-5. B-1 AC-14 ship↔design linkage →
  CONTENT. (Registry `docs/acceptance/m2-capability-registry.md`.)

## Delivery completeness

- Code + tests ✓; ADRs 0025/0026/0027 ✓; traceability (registry, PROGRESS,
  SPRINT-PLAN) ✓; validation report ✓; small Conventional Commits ✓; clean
  working tree in scope ✓; `@bluewave/combat` `BattleResolver`/`StrengthCalculator`
  unmodified ✓; goldens regenerated with documented cause ✓.

## Final decision

`M2_SURFACE_TACTICAL_CORE`: **COMPLETED** per DESIGN-55 §23 (scoped closure).
