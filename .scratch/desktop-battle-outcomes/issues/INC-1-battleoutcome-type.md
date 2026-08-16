# INC-1: BattleOutcome type + ClosingSnapshotSummary.battleOutcomes (campaign-engine)

Slug: desktop-battle-outcomes. Status: resolved. Blocked by: none.

## Task

In `packages/campaign-engine/src/simulation.ts`:

- Add an exported flat `BattleOutcome` interface (vanilla-safe, web-renderable):
  `battleId`, `areaId`, `attackerId`, `defenderId`, `winnerId: string|null`,
  `loserId: string|null`, `warScoreDelta: number`, `attackerLosses:
  readonly string[]`, `defenderLosses: readonly string[]`, `explanation:
  readonly string[]`.
- Add `battleOutcomes: readonly BattleOutcome[]` to `ClosingSnapshotSummary`.
- Keep `activeWars` (still `readonly unknown[]`) for backward compatibility —
  do not break `commitMonth.ts`'s construction or renderer consumers.

Re-export `BattleOutcome` from the package `index.ts` if the package follows a
single index export surface (check `packages/campaign-engine/src/index.ts`).

Acceptance: `tsc -b` clean; type is exported; the canary
(`apps/desktop/src/shared/campaign-command-contract.ts` `CAMPAIGN_COMMAND_NAMES`
— unchanged set) still passes; add a small type/canary test if the file has one.

## Validation

`cd packages/campaign-engine && pnpm exec vitest run --no-watch` (existing
projection suite + any new type test); `pnpm -w exec tsc -b`.

## Report

Exact commands + observed results + changed-files list.