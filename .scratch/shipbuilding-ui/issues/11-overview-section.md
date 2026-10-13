# 11: Overview section

**Type:** implementation
**Status:** resolved
**Blocked by:** 03
**Frontier:** no

Source: `.scratch/shippbuilding-ui.md` §"Overview".

## What to build

An Overview section that is a design summary rather than a duplicate form: ship type and
intended role, design year, displacement, cost, speed and range, armour summary, main armament
summary, crew and accommodation, technology constraints, design warnings, and combat-role
estimates. It also carries explicit design-priority settings (speed, protection, firepower,
range, cost) that do **not** automatically override the player's choices.

## Acceptance criteria

- [ ] Overview shows the listed summary values, all derived from compiled design state (not
      editable duplicates of other sections).
- [ ] Design warnings shown here match the Review findings.
- [ ] Design priorities are settable and displayed; changing a priority does not automatically
      modify the design unless an assisted-design mode is explicitly enabled (none exists yet).


## Answer

The Overview summary tab now leads with a design summary (`overview.ts` pure model + `components/OverviewPanel.tsx`):

- **Summary values**, all read from the compiled design: type and role, design year, displacement against hull
  capacity, cost, speed, range, an armour summary (coverage + weight), a main-armament summary, crew, technology
  (modernization expectation + design threat) and a role estimate. None is an editable duplicate of another section;
  the existing metrics, ledger and forecast panels remain below.
- **Design warnings** are the same severity counts the Review validation shows, with the explicit note that
  advisories never prevent submission while blocking findings do.
- **Design priorities** (speed, protection, firepower, range, cost) are settable and displayed as presentation state
  in the workspace; changing one never modifies the design (no assisted-design mode exists yet), and this is stated
  in the panel.

**Tests** `overview.test.ts` (summary from compiled state, warning counts equal `view.counts`, main-armament summary)
and `ShipbuildingWorkspace.test.tsx` ("Overview summary section": the summary and warnings render; priorities are
settable, displayed, and leave the design unchanged). **Commands:** overview + workspace suites pass; `pnpm typecheck`
clean; `vp lint`/`vp fmt` clean.
