# Ticket 02 — Integration Boundary

**Type:** decision
**State:** RESOLVED
**Blocked by:** 01

## Question
Where does gunnery resolution run in the existing M2 engine without changing the
phase pipeline or snapshot schema?

## Decision
Gunnery runs as a pure **engine stage** `resolveGunnery(...)` inside the existing
minute-advance simulation (`simulation/engine.ts`), executed **after** spotting
(step 8) of each minute, given the B-2 `TacticalContact` tracks and the observing
ships' batteries. It emits `GunneryEventRecord`s via the existing `BattleLedger`
+ `canonicalEventOrder` (DESIGN-38 §35 ordering). Deterministic event IDs derived
from canonical fields (same pattern as `evt()` in `engine.ts`).

- No phase-engine change: `battle_generation` / `battle_resolution` phase wiring is
  B-6. `BattleResolver`/`StrengthCalculator` unmodified.
- No campaign snapshot schema change; goldens unchanged (verified by the gate).
- Randomness: only keyed, domain-separated random decisions (hit draw, feed check)
  via the `@bluewave/random` domain-stream contract — no ambient RNG.

## Rationale / authority
Mirrors ADR-0018 (B-2 integration boundary). Keeps the M2 tactical core engine-only
and deterministic until the B-6 integration gate. Recorded in the B-3 ADR.
