# INC-13b — Real gun mount style (casemate vs turret)

**State:** READY_FOR_AGENT · **Frontier:** yes · **Blocked by:** none
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R26) · **ADR:** amends ADR-0131 (armament-change validation)

## What to build

The manual's secondary-battery rebuild condition (p32) distinguishes **casemates** from **turrets
of 6 inches or less**. ADR-0131 currently infers the mount style from the barrel count
(`packages/ship-design/src/refit.ts`: `casemate: barrels <= 1`), so a single-barrel turret above
6 in is wrongly re-batterable. Replace the inference with a real authored `mountStyle`
(`CASEMATE` / `TURRET`) attribute on gun components and read it in `armamentChangeFindings`.

## Acceptance criteria

- [ ] Gun components (main/secondary/dual-purpose) carry an authored `mountStyle` attribute with a
      strict schema and a defined default for existing content.
- [ ] `gunChangeOf` reads `mountStyle` instead of `barrels <= 1`; `GunChange.casemate` is derived
      from it.
- [ ] A single-barrel **turret** above 6 in is refused (`ARMAMENT_SECONDARY_CHANGE_NOT_ALLOWED`); a
      casemate of any permitted calibre is allowed — pinned by test.
- [ ] ADR-0131 records the attribute and removes the barrel-count approximation.
- [ ] Existing refit tests still pass; new boundary tests for casemate/turret.

## Notes for implementator

Touch the component schema + catalogue + `refit.ts`; keep the change compile-compatible
(a default keeps existing content valid). No new refit kind.
