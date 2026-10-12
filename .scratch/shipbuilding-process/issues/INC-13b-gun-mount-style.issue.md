# INC-13b — Real gun mount style (casemate vs turret)

**State:** RESOLVED · **Frontier:** yes · **Blocked by:** none
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R26) · **ADR:** amends ADR-0131 (armament-change validation)

## What to build

The manual's secondary-battery rebuild condition (p32) distinguishes **casemates** from **turrets
of 6 inches or less**. ADR-0131 inferred the mount style from the barrel count
(`packages/ship-design/src/refit.ts`: `casemate: barrels <= 1`), so a single-barrel turret above
6 in was wrongly re-batterable. `gunChangeOf` now reads the mount style from the first-class
armament content's authored `defaultMountType` (ADR-0093), with the barrel-count rule kept only as
the fallback for packs without armament content.

## Acceptance criteria

- [x] Gun components carry an authored mount style: `defaultMountType` on `gun-families.yaml`
      (already authored, keyed by the component id), read by `gunChangeOf` via `ctx.armamentContent`.
- [x] `gunChangeOf` derives `GunChange.casemate` from the authored mount type (only `TURRET` is a
      turret); `barrels <= 1` is the no-armament-content fallback.
- [x] A single-barrel **turret** above 6 in is refused (`ARMAMENT_SECONDARY_CHANGE_NOT_ALLOWED`); a
      casemate of the same calibre is allowed — pinned by test in `refit.test.ts`.
- [x] ADR-0131 records the authored mount style and demotes the barrel-count approximation to a
      fallback.
- [x] Existing refit tests still pass; new boundary tests for casemate/turret.

## Answer

The mount style was already authored in the first-class armament content
(`ship-building/armament/gun-families.yaml`, `defaultMountType`), with family ids equal to the
legacy component ids, and `lintArmamentContent` already drift-checks the two representations. Adding
a second `mountStyle` field to `ComponentDef` would have duplicated the data, so the rule reads the
authored value instead. No content pass was needed. ADR-0131 amended; no new ADR.
