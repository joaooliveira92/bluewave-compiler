# ADR-0064: New-Construction Work Packages Extend DESIGN-23 §18

## Status

Accepted 2026-10-08

## Context

DESIGN-23 §18 lists a closed set of package types oriented to repair, rebuild and
conversion (`REPAIR_STRUCTURE`, `MACHINERY`, `ARMOR`, `ARMAMENT`, `ELECTRONICS`, `AVIATION`,
`CONVERSION`, `DEFECT_REPAIR`, `TRIALS`, `COMMISSIONING`). SB-1 (`.scratch/ship-building/spec.md`
§15) needs a hull, launch and fit-out sequence for `NEW_CONSTRUCTION` with per-line capacity.

## Decision

1. `packages/ship-design` models new construction as eight packages: `HULL`, `MACHINERY`,
   `ARMOUR`, `ORDNANCE`, `LAUNCH`, `FIT_OUT`, `TRIALS`, `ACCEPTANCE`, with the acyclic dependencies in
   `planConstruction`. Package ordering for contended capacity extends DESIGN-23 §19.
2. When SB-14 wires this into the engine, the mapping onto DESIGN-23 is: `MACHINERY`->`MACHINERY`,
   `ARMOUR`->`ARMOR`, `ORDNANCE`->`ARMAMENT`, `FIT_OUT`->`ELECTRONICS`+`ARMAMENT` installation,
   `TRIALS`->`TRIALS`, `ACCEPTANCE`->`COMMISSIONING`; `HULL` and `LAUNCH` are added to the DESIGN-23 §18 list
   as new-construction-only types. DESIGN-23 is amended in the same change that wires them (not before).
3. Latent defects, acceleration, delay and payment rules stay exactly as DESIGN-23 defines; the schedule
   simulator in `ship-design` is a planning forecast, not the authoritative project state.

## Consequences

The Construction screen's `construction_order_v1` flat formula (ADR-0023) is replaced by `computeCost` and
`planConstruction` at wiring time (SB-14), with a migration note for in-flight projects.
