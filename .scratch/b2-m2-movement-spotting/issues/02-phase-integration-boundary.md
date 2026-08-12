---
Type: task
Status: resolved
Blocked by:
---

# B-2 / 02 — Phase-integration boundary

## Question

Should B-2 wire the new tactical simulation into the monthly phase pipeline,
replacing the strategic `BattleResolver` in `battle_resolution`?

## Answer

**No.** B-2 is engine-only. It adds a deterministic minute-advance tactical
simulation capability, proven by unit/integration/determinism tests, but does not
change the campaign snapshot schema, the phase registry, or `battle_resolution`.
`BattleResolver` and `StrengthCalculator` remain unmodified (both are M1-origin,
created before B-1, which left them untouched).

Consequences:
- Golden hashes (content, initial/closing snapshot, command/event/financial/random
  ledgers, replay, battleGeneration) stay **unchanged** — no ADR-0007 regeneration.
- Campaign↔tactical results integration (feeding a resolved tactical battle back
  into campaign war score / battle results) is explicitly **B-6**.
This keeps B-2 focused and avoids a premature upheaval of the accepted M1 strategic
auto-resolution path.
