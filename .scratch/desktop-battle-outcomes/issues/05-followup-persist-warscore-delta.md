# INC-5: Persist warScoreDelta / victory-class on the engine's `BattleResult`

Slug: desktop-battle-outcomes. Status: deferred. Blocked by: none (engine-sprint
follow-up, OUT of this sprint's scope).

## Why this exists

`commitMonth`'s `BattleOutcome.warScoreDelta` is currently re-derived OFF the
engine (desktop-only) from the losing side's loss-fraction on the PRE-month
snapshot, because `BattleResult` (`packages/campaign/src/state.ts:100`) does not
persist the per-battle `warScoreDelta` or victory class. This is the sustainable
fix (see ADR-0028 §Consequences): the authoritative delta should live on the
engine, not be recomputed by a bridge.

## Follow-up task (future engine sprint)

- Extend the engine's `BattleResult` (and/or the `BattleResolved` domain event if
  the phase is made to emit one) with a persisted `warScoreDelta` (and a stable
  `victoryClass: "decisive" | "major" | "minor"` for decided battles; null for
  non-decided) written by `applyBattleResult`
  (`packages/phase-engine/src/month.ts:1508-1552`) at the moment it applies the
  delta.
- Re-point the desktop bridge (`mapBattleOutcome` in
  `apps/desktop/src/main/commands/commitMonth.ts`) to read that persisted value
  instead of re-deriving it, eliminating both the off-engine re-derivation and
  the residual multi-battle-month inexactness (ADR-0028 §Decision).
- Snapshot-schema change → needs a compatibility/migration assessment per the
  delivery contract.

## Constraints / notes

- NOT to be started in this desktop sprint (the repair here is already correct
  for the single-battle-month derivation and changes no engine file).
- A `BattleResolved` event is NOT emitted by the `battle_resolution` phase today
  (ADR-0028 §Context) — do not assume it can be the source without an engine
  phase change.
- Keep the read-only-over-engine boundary until the engine owns the delta.