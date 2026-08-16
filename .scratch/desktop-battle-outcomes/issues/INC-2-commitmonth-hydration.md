# INC-2: commitMonth hydrates battle outcomes (bridge)

Slug: desktop-battle-outcomes. Status: resolved. Blocked by: INC-1.

## Task

In `apps/desktop/src/main/commands/commitMonth.ts`:

- After `executor.execute` succeeds, collect the battleIds that were resolved
  **this month** from `result.eventLedger.all` where the event body
  `kind === "BattleResolved"` (each `BattleResolved` carries `battleId`).
- Hydrate each from `result.finalSnapshot.wars.battles[]` (`BattleInstance` with
  `phase === "resolved"` and a `result: BattleResult`):
  `battleId`, `areaId`, `attackerId`, `defenderId`, `winnerId`, `loserId`,
  `attackerLosses`, `defenderLosses`, `explanation`.
- `warScoreDelta`: the engine stores only the *current* per-side war score, not
  the per-battle delta. The **grounded source** is the same rule the engine
  applies in `packages/phase-engine/src/month.ts:1527-1538`: victory level from
  loss-fraction (`VICTORY_MAJOR_MAX_FRACTION`/`VICTORY_MINOR_MAX_FRACTION`) →
  magnitude (`WAR_SCORE_DECISIVE=10`/`MAJOR=5`/`MINOR=2` from
  `packages/campaign/src/warConstants.ts`). Re-derive it deterministically for
  each resolved battle: the losing side's fleet ships (via
  `BattleInstance.attackerFleetIds`/`defenderFleetIds` → snapshot fleet
  definitions → ships not under construction) have `hitPoints` and a
  `BattleResult.damageReport` on the *post-battle* snapshot, so
  `lossFraction = sum(damageReport[id]) / sum(hitPoints)` is recomputable —
  mirror `month.ts:1520-1538` exactly and cite it. If any input needed for that
  is unavailable on the post-battle snapshot, set `warScoreDelta: 0` and record
  why (bridge must not fabricate). Record the chosen approach in your report.
- Populate `response.closingSnapshot.battleOutcomes` with the mapped array
  (mutate the `activeWars` construction to also set `battleOutcomes`). No
  `BattleResolved` event → `[]` (byte-identical to prior behaviour).
- Add/extend `commitMonth.test.ts`: a month resolving ≥1 battle produces an
  accurate flat `battleOutcomes`; a no-battle month produces `[]` and an
  unchanged snapshot hash.

Acceptance: AC-1, AC-2, AC-3 (spec). Golden/authoritative hashes unchanged.

## Validation

`cd apps/desktop && pnpm exec vitest run --no-watch` (commitMonth + campaign
bridge); `cd packages/phase-engine && pnpm exec vitest run --no-watch`;
`pnpm -w exec tsc -b`.

## Report

Exact commands + observed results + changed-files list + stated
`warScoreDelta` source.