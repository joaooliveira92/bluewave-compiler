# 09 — Narrow battle auto-resolution

**What to build:** Canonical battle manifests with legal mapped assets, explained strength comparison, named deterministic decisions, bounded damage/losses, domain events, and campaign consequences. No ship is in two unresolved battles and loss/damage maps to campaign assets. Labeled narrow — does not claim tactical equivalence.

**Blocked by:** 02, 04

**Status:** resolved

- [x] `BattleManifest` type with legal asset mapping
- [x] Strength calculation with structured explanation
- [x] Named deterministic random decisions for battle outcomes
- [x] Damage/loss bounded computation
- [x] Domain events for battle resolution
- [x] Campaign consequence application (fleet damage, losses, morale)
- [x] No ship in two unresolved battles invariant
- [x] Labeled narrow — no tactical equivalence claim in output
- [x] Tests: resolution determinism, bounded damage, asset invariants

## Answer

Implemented `packages/combat` with `BattleResolver` (deterministic resolution using firepower, armor, HP, random variance), `StrengthCalculator`, `BattleManifest`. Algorithm: strength → random factor → compare → proportional damage → explanation tree. 10 tests pass.
