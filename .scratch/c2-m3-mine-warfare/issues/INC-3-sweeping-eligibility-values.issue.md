# INC-3 — Sweeping Eligibility + Base Values + Dual Equipment + Effective Value

**Type:** implementation
**Status:** open
**Blocked by:** INC-2
**Frontier:** no

## Acceptance (spec AC-6..AC-9)

- Minesweeping eligibility (§6): all predicates (ship type `DD`/`KE`/`CL`/`AMC`/
  `TR`-converted/other-explicitly-eligible; equipment installed+operational+
  compatible; mission `MINE_WARFARE` or `TRADE_PROTECTION`-with-sweeping-
  authorization; readiness `ACTIVE`; damage `OPERATIONAL`/`DEGRADED`; location
  in swept area/connected approach; fuel/supply/crew/ammunition-or-sweep-
  inventory pass; not working-up/mobilizing/unavailable/interned/captured/
  major-dockyard; validated sweeping command/plan active); ineligible → zero
  contribution + `MINESWEEPING_SHIP_INELIGIBLE` (`test/mines/sweeping-eligibility.test.ts`).
- Sweeping base values (§7) exact: dedicated fleet minesweeper `150`, dedicated
  coastal minesweeper `100`, DD w/ equipment `80`, KE w/ equipment `100`, CL
  w/ equipment `60`, AMC w/ equipment `50`, converted TR `120`; every equipment
  definition identifies exactly one base value or explicit replacement
  formula; a ship name/class description MUST NOT grant sweeping value
  (`test/mines/sweeping-base-values.test.ts`).
- Dual ASW/mine equipment (§8): `dual_asw_mine_equipment_v1` exact five-mode
  table; mode selected by locked mission/equipment command before resolution;
  never full ASW + full sweeping simultaneously; missing mode on
  dual-purpose-declared equipment defaults to balanced ONLY (ticket 04's
  narrow reading — do not default single-purpose equipment); other missing
  configurations → `DUAL_EQUIPMENT_MODE_MISSING` (`test/mines/dual-equipment.test.ts`).
- Effective sweeping value (§9): exact formula (base × equipmentMode × tech ×
  crew × readiness × damage × support / `10_000^6`, one FLOOR) + exact
  mine-type resistance multipliers applied AFTER aggregation (contact `10_000`,
  magnetic `7_500`/`10_000`, acoustic `7_500`/`10_000`, controlled-defensive
  `5_000`, submarine-laid `9_000`, scenario-special definition-required);
  missing resistance data → `MINE_SWEEP_RESISTANCE_MISSING`
  (`test/mines/effective-sweeping.test.ts`).

## Hints

The resistance multiplier applies to the AGGREGATED regional value, not
per-ship (see INC-4) — keep `effectiveSweepingValue` (per ship, pre-resistance)
and the resistance step (per mine-pressure record, post-aggregation) as
separate functions so INC-4 can compose them per §10's literal formula order.
