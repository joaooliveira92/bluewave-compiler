# INC-4 — Component Damage + Turret States + Structure/Flotation + Event + Ordering + Engine Wiring

**State:** READY_FOR_AGENT · **Blocked by:** INC-3
**Spec:** `.scratch/b4-m2-armor-damage/spec.md` (AC-6, AC-7, AC-10..12)

## Acceptance criteria
- AC-6 Stage 3 component damage: spatially eligible components only, stable-id order, exact outcome set (`UNAFFECTED`/`DEGRADED`/`JAMMED`/`DISABLED`/`DESTROYED`/`BURNED_OUT`/`FLOODED`/`ISOLATED`), `DAMAGE_COMPONENT_OUT_OF_SCOPE`; §7 turret states OPERATIONAL/JAMMED/DISABLED/DESTROYED/BURNED_OUT with exact effects + no elapsed-time restoration.
- AC-7 Stage 4 structure+flotation: `max(0, before − damage)` on separate tracks; uncapped amount preserved in the record.
- AC-10 Stage 9 `DamageEventRecord` (§45 fields incl. performance before/after + terminal transition + RNG decisions + versions + hash).
- AC-11 canonical ordering (§46) via `BattleLedger` + `canonicalEventOrder`.
- AC-12 `resolveDamage` engine stage after `resolveGunnery` in minute-advance; **strict no-op when no impact/hazard** (B-2/B-3 hashes unchanged); `BattleResolver`/`StrengthCalculator` unmodified (diff).

## Notes
Event/ordering mirror B-3 (`src/gunnery/event.ts`, `ledger-order.test.ts`). Engine wiring mirrors `src/gunnery/resolve.ts`. Integration-boundary test asserts the no-op path emits nothing.