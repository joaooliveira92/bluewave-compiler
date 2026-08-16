# INC-2 — Mine Sources + Laying Value + Pressure Increase

**Type:** implementation
**Status:** open
**Blocked by:** INC-1
**Frontier:** no

## Acceptance (spec AC-3, AC-4, AC-5)

- Mine sources (§3): all six canonical source kinds (controlled naval bases,
  eligible coastal artillery/controlled-mine installations, mine-capable
  surface ships, minelaying submarines, scenario minefields, typed event
  minefields) referenced by a laying action (source, exact inventory or
  generated scenario allocation, target belligerents, area, laying month,
  policy); ineligible source (missing tech/inventory/access/control/mission) →
  `MINE_LAYING_SOURCE_INELIGIBLE` (`test/mines/sources.test.ts`).
- `AreaMinePressureRecord` (§1) shape ships here too (state module), since
  laying/pressure-increase functions need the record type — full field set,
  zero-pressure-as-absence, historical append-only (`test/mines/pressure-record.test.ts`).
- Mine-laying value (§4): exact integer formula
  `floor(baseLayingValue * technologyMultiplierBp * crewMultiplierBp *
  readinessMultiplierBp * damageMultiplierBp * supplyMultiplierBp *
  missionMultiplierBp / 10_000^6)`, exact rational retained through all six
  multipliers, rounded once with FLOOR; shipped generic multiplier table
  (tech `10_000`/`7_500`; crew `7_500`/`10_000`/`11_000`/`12_000` by band;
  readiness ineligible-below-40, `7_500`/`10_000`/`11_000` by band; degraded
  damage `5_000`; unsupported/fuel-ineligible `0`); inventory consumption
  exactly equals declared quantity; insufficient → `MINE_INVENTORY_INSUFFICIENT`
  (`test/mines/laying-value.test.ts`).
- Pressure increase/reinforcement (§5): `addedPressure = min(1_000_000 -
  currentPressure, effectiveLayingValue)`; saturation at `1_000_000` blocks
  further addition until decay/sweep reduces it; reinforcement updates source
  composition and freshness via a weighted integer calculation, never resets
  all pressure to full freshness (`test/mines/pressure-increase.test.ts`).

## Hints

Reuse the branded-integer/basis-point helpers already in
`@bluewave/contracts`/`packages/combat/src/damage/` rather than reinventing
FLOOR/clamp utilities. Keep the six-factor product computed as one exact
integer expression before the single FLOOR (no per-factor rounding).
