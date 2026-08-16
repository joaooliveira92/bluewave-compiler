# INC-4 — Regional Sweeping Aggregation + Allocation

**Type:** implementation
**Status:** open
**Blocked by:** INC-3
**Frontier:** no

## Acceptance (spec AC-10)

- Regional sweeping value: sum of effective eligible-ship values (INC-3) in
  ascending ship-identifier order.
- Per mine-pressure record: `typeAdjustedSweeping = floor(regionalSweepingValue
  * mineTypeResistanceMultiplierBp / 10_000)`; `sweptPressure =
  min(currentPressure, typeAdjustedSweeping)`; `pressureAfterSweeping =
  currentPressure - sweptPressure`; never below zero.
- One sweeping allocation MUST NOT apply its full value to multiple
  mine-pressure records. Allocation order exactly: (1) controlled-defensive
  mines threatening the sweeping side; (2) highest current strike risk;
  (3) highest pressure; (4) mine-type identifier; (5) mine-pressure
  identifier. Unused sweeping value passes to the next record in that order
  (`test/mines/sweeping-aggregation.test.ts`).
- Emits `MINE_PRESSURE_REDUCED` when `sweptPressure > 0`.

## Hints

This is the "budget allocation" step — model it as consuming a single mutable
regional-value accumulator across an explicitly sorted record list (sort key
tuple exactly matching the five-part order above), never relying on input
array order or object-key iteration. Mirror the deterministic-sort pattern
used in `packages/combat/src/damage/` or `spotting/` for keyed candidate lists.
