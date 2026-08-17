# INC-3: Turn report Battle Outcomes renderer

Slug: desktop-battle-outcomes. Status: resolved. Blocked by: INC-2.

## Task

In `apps/desktop/src/renderer/screens/simulation/components/TurnReportTab.tsx`
(reads `commitResult: CommitMonthResponse`):

- Add a "Battle Outcomes" section (accordion item or card) rendering
  `commitResult.closingSnapshot.battleOutcomes`: per battle show battleId, the
  two sides (attacker vs defender), winner/loser names or a tie/empty state
  (winnerId null → "No conclusive result"), war-score delta, and ship losses
  (count + ids for attackerLosses/defenderLosses).
- Honest empty state when `battleOutcomes.length === 0` ("No battles resolved
  this month").
- Pure presentation over the read-only response; no state mutation, no
  authoritative access.
- Match existing component style (Card/Accordion/Item/Badge) and honest
  copy conventions used in the rest of the app.

Acceptance: AC-4, AC-5 (spec). Add render/reducer cases: several resolved
battles render; empty month shows the honest state.

## Validation

`cd apps/desktop && pnpm exec vitest run --no-watch` (TurnReportTab +
simulation render tests); `pnpm -w exec tsc -b`.

## Report

Exact commands + observed results + changed-files list.