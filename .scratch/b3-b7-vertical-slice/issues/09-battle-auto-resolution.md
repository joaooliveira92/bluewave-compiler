# 09 — Narrow battle auto-resolution

**What to build:** Canonical battle manifests with legal mapped assets, explained strength comparison, named deterministic decisions, bounded damage/losses, domain events, and campaign consequences. No ship is in two unresolved battles and loss/damage maps to campaign assets. Labeled narrow — does not claim tactical equivalence.

**Blocked by:** 02, 04

**Status:** ready-for-agent

- [ ] `BattleManifest` type with legal asset mapping
- [ ] Strength calculation with structured explanation
- [ ] Named deterministic random decisions for battle outcomes
- [ ] Damage/loss bounded computation
- [ ] Domain events for battle resolution
- [ ] Campaign consequence application (fleet damage, losses, morale)
- [ ] No ship in two unresolved battles invariant
- [ ] Labeled narrow — no tactical equivalence claim in output
- [ ] Tests: resolution determinism, bounded damage, asset invariants
