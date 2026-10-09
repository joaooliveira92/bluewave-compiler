# 33: Armour coverage and scheme

**Type:** implementation
**Status:** resolved
**Blocked by:** none
**Frontier:** yes

Spec: `parity-spec.md` F3 (revised: no new draft fields; ADR-0076 decision 3 applies only to later tickets).

Acceptance:
- `set_armour_regions` atomic edit (order kept, duplicate region rejected, ARMOUR change kind).
- `armourMaterialOptions(balance, month, techs)`, `newArmourRegion(region, sizing, material)`, `allOrNothingRegions`.
- Protection panel: coverage and weight, per-region size/plate/material/inclined, add region, "All or nothing".
- Material options the nation cannot make yet are disabled with the reason.

## Comments

### 2026-10-09 orchestrator

Implemented as revised. Domain in `armour.ts` and `edits.ts`/`revision.ts`; panel in `ArmourPanel.tsx`; `describeEdit` now reports armour values. Tests: `armour.test.ts` (materials, starting sizes, all-or-nothing, atomic edit), DrawingBoard render tests (edit size and slope, add region, materials). Note: the shipped `balance.yaml` has no `materialAvailability` entries yet, so no material is disabled in the shipped content (the gating is covered by the pure tests); applying ticket 25's content is separate.
