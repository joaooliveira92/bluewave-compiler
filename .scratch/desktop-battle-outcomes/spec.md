# Spec: Desktop tactical battle-outcome surfacing (B-6 follow-up)

Slug: `desktop-battle-outcomes`
Scope owner: orchestrator (read-only over the engine). Status: approved-frontier.

## Problem

`commitMonth` already auto-resolves war-triggered battles inline and the engine
emits `BattleResolved` domain events plus a resolved `BattleResult` on
`snapshot.wars.battles[]` (winner/loser/attackerLosses/defenderLosses/
damageReport/explanation). The desktop's turn report discards all of it:
`ClosingSnapshotSummary.activeWars` is `readonly unknown[]`, `TurnReportTab`
lists only the event *kind* ("BattleResolved") with no outcome, and the
Simulation screen shows no winner/loser, war-score delta, or ship losses for
the month's battles.

This is the recorded next frontier of the desktop-gate effort
(`.scratch/desktop-engine-feature-gate/map.md`) and candidate 1 of
`.scratch/desktop-feature-gate/`.

## Solution

Surface the month's resolved battle outcomes in the Simulation → Turn Report,
**derived from the engine** — nothing fabricated, no authoritative behavior
changed.

1. **campaign-engine**: add an accurate `BattleOutcome` type + a
   `battleOutcomes: readonly BattleOutcome[]` field to `ClosingSnapshotSummary`
   (replacing the dead `activeWars: readonly unknown[]` — kept non-breaking by
   deriving `activeWars`), typed flatly (vanilla-safe) so the renderer can show
   it.
2. **desktop `commitMonth`**: after execute, collect the battleIds from
   `BattleResolved` domain events in `result.eventLedger`, hydrate each from
   `result.finalSnapshot.wars.battles[]` (`BattleInstance.result`), and map to
   the web `BattleOutcome` shape (battleId, areaId, attackerId, defenderId,
   winnerId, loserId, warScoreDelta, attackerLosses[], defenderLosses[],
   explanation[]). No battle → empty array (byte-identical to today).
3. **renderer**: add a "Battle Outcomes" card/accordion to `TurnReportTab`
   listing each resolved battle: sides, winner/loser, war-score delta, and
   ship losses (count + ids), with an honest empty state.
4. **tests**: bridge `commitMonth` (battle present → accurate flat outcome;
   no battle → empty, unchanged hashes), campaign-engine type/canary, renderer
   reducer + render cases.

## Acceptance criteria

- AC-1: After a month that resolves ≥1 battle, `commitMonthResponse.closingSnapshot.battleOutcomes`
  contains one flat `BattleOutcome` per resolved battle with battleId, sides,
  winner/loser, and the engine's loss/explanation data.
- AC-2: `activeWars` behaviour is unchanged (still lists non-ENDED wars).
- AC-3: A month that resolves no battles returns `battleOutcomes: []` and the
  campaign hash / golden hashes are byte-identical to before this change.
- AC-4: The turn report renders the resolved battles with honest copy; an empty
  month shows an explicit "no battles this month" state (not a fabricated one).
- AC-5: The renderer never mutates authoritative state; it only reads
  `commitMonthResponse.closingSnapshot.battleOutcomes`.
- AC-6: No engine/combat/phase-engine package or content pack is modified; no
  golden authoritative hash changes (surface + campaign-engine type only).
- AC-7: desktop suite + campaign-engine suite green; `commitMonth` two-process
  determinism retained; `tsc -b` + lint clean (excluding pre-existing unrelated
  failures).

## Out of scope

- Tactical battle *play* (Battle Arena graduation) — not this frontier.
- Surfacing weather/AI-plan/design-template candidates (gate candidates 2–5).
- Any change to `BattleResolver`/`StrengthCalculator`/phase-engine/combat.

## Definition of done

Bridge response carries accurate battle outcomes → renderer shows them →
proving tests for AC-1..AC-7 → orchestrator validation gate (uncached build,
`tsc -b`, full suites, goldens unchanged, two-process determinism) → clean
working tree → Conventional Commits on `dev` → traceability + report.