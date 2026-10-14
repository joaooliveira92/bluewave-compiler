# 09: Machinery section — outcomes first

**Type:** implementation
**Status:** resolved
**Blocked by:** 03
**Frontier:** no

Source: `.scratch/shippbuilding-ui.md` §"Machinery".

## What to build

Organise the Machinery section around outcomes rather than a flat parameter list: performance
targets (target speed, operational range, cruising speed) and propulsion configuration (engine
type, boilers, fuel type, shaft count, machinery arrangement) on one side, and calculated
results (horsepower required, machinery weight, fuel capacity, cost, reliability, acceleration)
on the other. The player must not get circular controls where both versions of a value appear
editable while one silently overrides the other.

## Acceptance criteria

- [ ] Performance targets and propulsion configuration are editable inputs; calculated results
      are shown as outputs.
- [ ] Entering a target speed or a power configuration is supported by an explicit model, with
      no pair of fields that are both editable while one silently overrides the other.
- [ ] Editing any input updates the compiled results immediately.
- [ ] Existing machinery inputs are relocated with no functional regression.


## Answer

The Machinery section is now outcomes-first (`machinery-view.ts` pure model + `components/MachineryEditor.tsx`):

- **Inputs (editable):** target speed, cruising speed and operational range (`set_requirement`), and the propulsion
  configuration — plant, installed power, fuel capacity (`set_machinery`). Plant choices are gated by design month
  and unlocked technology, shown disabled with a reason.
- **Outputs (calculated, read-only):** power required at target speed, speed achieved, machinery weight, fuel use at
  cruise, range at cruise, reliability and machinery cost — every one read from the compiled `WorkshopView`
  (`compiled.machinery`, `forecast.costBreakdown`). No output is an editable control, so there is no pair of fields
  where one silently overrides the other.
- **Deferred:** acceleration is not modelled (`MachineryResult` has no acceleration term), so the editor states this
  rather than inventing a figure.

**Tests** `machinery-view.test.ts` (inputs mirror the draft, outputs come from the compiled design, input/output label
sets are disjoint, plant gating) and `ShipbuildingWorkspace.test.tsx` ("Machinery outcomes-first section": editable
configuration beside read-only calculated results). **Commands:** machinery model + workspace suites pass;
`pnpm typecheck` clean; `vp lint`/`vp fmt` clean.
