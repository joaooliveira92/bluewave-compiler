# INC-13 — Armament-change validation

**State:** READY_FOR_AGENT · **Frontier:** yes · **Blocked by:** none
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R26) · **ADR:** armament-change validation (new)

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
