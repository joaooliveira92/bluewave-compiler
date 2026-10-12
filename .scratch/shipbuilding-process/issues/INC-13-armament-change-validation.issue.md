# INC-13 — Armament-change validation

**State:** RESOLVED · **Frontier:** yes · **Blocked by:** none
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R26) · **ADR:** armament-change validation (ADR-0131)

## What to build

Give the rebuild's armament change the manual's conditions, so a rebuild can only swap guns in the ways
the reference allows — modernising the same calibre, trading turret count against calibre within
compatible limits, and re-battering secondaries only from casemates or small turrets.

## Acceptance criteria

- [ ] `REARMAMENT` gains a validation rule set (**not** a new refit kind): main guns above 6 in cannot
      be changed (a refresh to a more modern gun of the **same** calibre is allowed); secondary/tertiary
      batteries may change only when the existing guns are casemates or `≤6 in` turrets, and may become
      any arrangement of `≤6 in` guns; triple↔double or double↔single swaps only within compatible
      calibres (worked examples: double 8 in → single 10 in; triple 12 in → double 16 in).
- [ ] An incompatible change fails with a specific reason code and changes no state.
- [ ] Tests: unit (each condition with the worked examples); boundary (>6 in main gun; the 6 in
      secondary edge).

## Notes for implementator

Validation only, inside the existing refit evaluation and rebuild path. Extends ADR-0067; new ADR
records the rule set and reason codes.

## Answer

The manual's armament-change conditions are enforced in the `REARMAMENT` refit path.

- `armamentChangeFindings(removed, added, mainGunMaxUm)` (`@bluewave/ship-design` `refit.ts`) is the one rule set:
  main guns refresh at the same calibre or trade barrel-count against calibre within a compatible limit; an above-6 in
  main gun with no replacement is refused (`ARMAMENT_MAIN_GUN_UNCHANGEABLE`), an incompatible swap is refused
  (`ARMAMENT_INCOMPATIBLE_CALIBRE`); secondaries change only from casemates or ≤6 in turrets
  (`ARMAMENT_SECONDARY_CHANGE_NOT_ALLOWED`) and only to ≤6 in guns (`ARMAMENT_SECONDARY_TOO_LARGE`).
- It is called from `evaluateRefit` when the kind is `REARMAMENT` (validation only — no new refit kind).
- Mount style: the component model has no casemate/turret flag, so a single-barrel mounting is read as a casemate and
  a multi-barrel one as a turret (recorded in ADR-0131).
- ADR-0131 records the rule set and reason codes; tests pin both worked examples (double 8 in → single 10 in,
  triple 12 in → double 16 in), the refresh and unchangeable-main cases, and the secondary boundaries.

Commands: `@bluewave/ship-design` `vp test run test/refit.test.ts` (41 passed); `tsc --noEmit` clean.
