# ADR-0074: Designed ships are priced by the cost model, in treasury units

## Status

Accepted 2026-10-08. Follows ADR-0066 (SubmitDesign) and ADR-0070 (ReviseProject); replaces the displacement formula for designed ships only.

## Context

The Drawing Board forecast a ship's cost in pounds with the ship-design cost model (hull, armour, machinery, components, speed premium, first-of-class). Ordering that ship charged the treasury `construction_order_v1`: one unit per 100 tonnes (`round(kg / 100,000)`). The two disagreed by a factor of 5,000-13,000, and the formula could not tell an equipped destroyer from an empty hull of the same weight (the model prices a destroyer near £130 per tonne and a battleship near £97).

## Decision

1. **A unit of treasury and project work is £10,000** (`environment.treasuryUnitMicro: 10000000000` in `balance.yaml`). Calibrated so a Majestic-class battleship costs about as many units as the old formula gave (about 125); the starting treasury of 1,000 units is then £10 million, the scale of a navy's yearly shipbuilding in 1880.
2. **The price is fixed when a design is compiled.** `SubmitDesign` and `ReviseProject` compute `computeCost(...).total` for the compiled design and store `CompiledDesignVersion.constructionCostUnits = treasuryCostUnits(total, treasuryUnitMicro)` (round up, never below 1). `treasuryCostUnits` is a pure integer function in `ship-design`.
3. **One reading point.** `projectedConstructionOrderCosts` (campaign-engine) returns `constructionCostUnits` when the design has one and the displacement formula otherwise. The order wizard, the project's total work, revisions and the Drawing Board all go through it, so the designer's forecast and the amount charged are the same number. The Drawing Board forecast now shows "Charged to the treasury when ordered: N units (£10,000 each)".
4. **Authored designs are unchanged** (no field, formula as before), so existing saves and golden hashes do not move.

## Consequences

An authored ship and a designed ship of similar weight can differ in price, because the designed one is priced by its equipment. That is intended: it is what makes design choices cost something. The unit is a ruleset constant, so rebalancing the economy is one number. Monthly upkeep still uses the cost model's own pounds and is not yet charged in units (the monthly budget has its own scale); that is a later step.

## Not done

Authored designs still use the displacement formula until they are imported as drafts (ticket 14 follow-up).
