# Validation Report: Desktop tactical battle-outcome surfacing (desktop-battle-outcomes)

Slug: `desktop-battle-outcomes`. Status: **PASS** — APPROVE (after one NEEDS_REWORK repair loop).

## Outcome

The desktop Simulation → Turn Report now surfaces the month's auto-resolved
battles — winner/loser, war-score delta, ship losses, and the engine's
explanation — **derived from the engine** (nothing fabricated, no authoritative
behavior or golden hash changed). This is the recorded next frontier of the
desktop gate (`.scratch/desktop-engine-feature-gate/map.md`) and candidate 1 of
`.scratch/desktop-feature-gate/`. `BattleResolver`/`StrengthCalculator`/
phase-engine/combat untouched.

## Scope delivered

- **campaign-engine** (type-only, no hash impact): flat `BattleOutcome` type +
  `ClosingSnapshotSummary.battleOutcomes` (`packages/campaign-engine/src/simulation.ts`).
- **bridge** (`apps/desktop/src/main/commands/commitMonth.ts`): hydrates
  `battleOutcomes` per battle resolved THIS month via the pre→post resolved-set
  delta (the engine never emits `BattleResolved` events). `warScoreDelta`
  re-derives the engine's victory class (`month.ts:1508-1538`) over the **PRE**
  snapshot (pre-battle HP incl. ships sunk this month); unavailable-loser ⇒
  `warScoreDelta: 0` + explanation (never a fabricated +10); non-decided ⇒ 0
  (ADR-0026 §7). `activeWars` unchanged.
- **renderer** (`TurnReportTab.tsx`): "Battle Outcomes" accordion — sides,
  winner/loser (honest tie/time-limit copy when null), war-score delta, ship
  losses, engine explanation; honest empty state "No battles resolved this month".
  Presentation-only over the read-only response.
- **ADR-0028** (war-score re-derivation basis + residuals) + follow-up ticket
  (`05-followup-persist-warscore-delta.md`) to persist the delta on the engine's
  `BattleResult` in a future engine sprint.

## Requirements evidence

| AC   | Deliverable                                         | Evidence                                                                                                |
| ---- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| AC-1 | accurate flat `battleOutcomes` per resolved battle  | `commitMonth.test.ts` (war-outcomes case asserts every field incl. warScoreDelta vs independent oracle) |
| AC-2 | `activeWars` unchanged                              | `commitMonth.test.ts:214` + no-battle case                                                              |
| AC-3 | no-battle → `[]`, byte-identical                    | no-battle case pins `[]` + envelope/rawHash; `verify-golden-hashes.cjs` 10/10                           |
| AC-4 | renderer honest surfaces                            | `TurnReportTab.test.tsx` (2 decided, undecided, empty)                                                  |
| AC-5 | renderer presentation-only                          | `TurnReportTab.tsx` type-only engine import, no state                                                   |
| AC-6 | no engine/combat/phase-engine/content/golden change | `git status` (only desktop + campaign-engine type)                                                      |
| AC-7 | suites + tsc + determinism green                    | below                                                                                                   |

## Commands and observed results

```text
$ git status
  on dev; only this sprint's files (4 modified + 5 untracked working + scaffold)

$ pnpm -w turbo run build --force
  Tasks: 18 successful, 18 total; Cached: 0, 18 total  (uncached clean)

$ pnpm -w exec tsc -b
  exit 0 (clean)

$ cd apps/desktop && pnpm exec vitest run --no-watch
  49 files, 353 tests passed  (incl. 14 commitMonth tests, 3 TurnReportTab, 3 mapBattleOutcome)

$ cd packages/campaign-engine && pnpm exec vitest run --no-watch
  8 files, 49 tests passed

$ cd packages/phase-engine && pnpm exec vitest run --no-watch
  12 files, 108 tests passed  (untouched)

$ cd packages/combat && pnpm exec vitest run --no-watch
  900 tests passed

$ cd packages/cross-process-test && pnpm exec vitest run --no-watch
  3 files, 14 tests passed (two-process determinism)

$ node scripts/verify-golden-hashes.cjs
  All 10 hashes match golden reference  (authoritative unchanged)

$ pnpm -w turbo run test
  per-package verified individually (known parallel EPIPE flake in turbo parallel);
  the sole repo-wide red = the documented pre-existing unrelated
  `packages/content-schema/test/nation.test.ts` broken import (tracked in PROGRESS)

$ pnpm lint
  0 warnings, 18 errors — ALL in `prototype/desktop-e2e-harness/` (pre-existing
  unrelated draft harness); this sprint's files lint-clean
```

## Determinism evidence

- Two-process cross-process suite: 14/14 byte-identical (unchanged by this
  surface-only sprint). The derived `battleOutcomes` path introduces no RNG,
  clock, env, or filesystem ordering — it is a pure read of the two
  authoritative snapshots.
- The `warScoreDelta` test oracle independently reads the engine's written
  pre→post war-score change (not a copy of the bridge formula); a discriminating
  decisive(±10)/major(±5)/minor boundary + non-decided(0) + lossy-fallback(0) are
  pinned and FAIL if the pre-battle basis regresses to post.

## Canonical artifact changes

None. No golden or authoritative hash changed (verified 10/10). The change is
type-only (campaign-engine) + desktop bridge/renderer + ADR + scaffold docs.

## Tests added

- `packages/campaign-engine/test/battle-outcome-type.test.ts` (3).
- `apps/desktop/src/main/commands/commitMonth.test.ts` (14 incl. independent
  engine-applied oracle, decisive/major/fallback/non-decided, no-battle).
- `apps/desktop/src/renderer/screens/simulation/components/TurnReportTab.test.tsx` (3).

## Security and cancellation

Azod-validated IPC unchanged (response shape only); renderer stays on shared
`@bluewave/campaign-engine` types; no new IPC channel, no shell, no fs/network/
clock/env in the new code. No cancellation surface added.

## Performance observations

Constant-size; each of ≤ a handful of battles a month does one linear scan of
the loser's fleet over the two snapshots.

## Limitations and deferred

- `warScoreDelta` is re-derived off-engine from the pre-battle basis; exact for
  the common single-battle month, with two documented accepted residuals
  (multi-battle cascade; same-month commissioning) — ADR-0028 §Consequences.
  The sustainable fix (persist the delta on engine `BattleResult`) is recorded
  as a deferred follow-up ticket, not started for this read-only-over-engine
  sprint.
- Pre-existing unrelated failures NOT introduced here: `content-schema/
  nation.test.ts` broken import; `prototype/desktop-e2e-harness/*.draft.ts`
  lint errors; the parallel turbo-EPIPE test flake.

## Commits

See `git log`; Conventional Commits on `dev`. No push/PR (no remote-op per
delivery contract). Clean working tree at the end of the sprint.
