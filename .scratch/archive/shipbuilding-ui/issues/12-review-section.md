# 12: Review section

**Type:** implementation
**Status:** resolved
**Blocked by:** 03
**Frontier:** no

Source: `.scratch/shippbuilding-ui.md` §"Review".

## What to build

A structured validation section that clearly separates the three classes of finding: blocking
errors (displacement exceeds hull capacity, component overlap, invalid turret arc, machinery
does not fit, missing crew accommodation), warnings (low stability, excessive topside weight,
main belt protects too little of the hull, restricted secondary fire, range below role), and
advisory observations (speed below comparable ships, limited ammunition endurance, inefficient
armour distribution, cost over target). Unusual but physically valid experimentation is not
prevented.

## Acceptance criteria

- [ ] Findings are grouped into blocking / warning / advisory with distinct affordances.
- [ ] Each finding links to its offending control and, where applicable, highlights the
      affected element on the ship.
- [ ] Advisory findings never prevent submission; blocking findings do.
- [ ] The finish/validate/submit action is reachable from Review.
- [ ] The existing validation engine is reused; no new validation rules are invented here.


## Answer

The Review section's validation (`FindingsPanel`) now groups findings into the three classes the ticket names, each
its own labelled region with the class's distinct affordance:

- **Blocking errors** (BLOCKING + CRITICAL), **Warnings** (WARNING) and **Advisory observations** (ADVISORY) —
  `FINDING_CLASSES`/`CLASS_OF`/`CLASS_LABEL` in `validation/severity.ts`. Empty classes are omitted.
- Findings keep their existing affordances: severity icon and badge, the rule-evidence hover card, and **Show on
  ship**, which in the workspace pins the finding's entity and drives the screen↔selection router (ADR-0142) to open
  the offending section/tab and focus its control. Warnings and advisories never change `view.valid`, so only
  blocking-class findings prevent submission (the `Verdict` and `SubmitPanel` already gate on `view.valid`).
- The finish action stays reachable: the command bar's Validate/Finish open the Review tab, and the Finish local tab
  hosts `SubmitPanel` (or a not-available note outside a campaign). No validation rule was added.

**Tests** `ShipbuildingWorkspace.test.tsx` ("Review section": findings are grouped into class regions and partition the
finding list; Finish is reachable from Review). The shared Drawing Board validation suite (using the same panel)
stays green. **Commands:** workspace + drawing-board validation suites → 57 passed; `pnpm typecheck` clean;
`vp lint`/`vp fmt` clean.
