# 10: Systems section

**Type:** implementation
**Status:** resolved
**Blocked by:** 03
**Frontier:** no

Source: `.scratch/shippbuilding-ui.md` §"Systems".

## What to build

A Systems section that shows only the installations relevant to the selected design year and
hull type — fire control, rangefinders, directors, radio, radar, anti-aircraft direction,
searchlights, aviation, mines, depth charges, colonial-service accommodation — with locked
technology shown disabled with an explanation, and an optional "show unavailable technology"
filter for players who want to see what is coming.

## Acceptance criteria

- [ ] Systems are grouped into local tabs (e.g. fire control, sensors, aviation, accommodation)
      and gated by design year and hull type.
- [ ] Locked technology appears disabled with a reason (e.g. "Unavailable until the required
      technology is researched"), rather than silently vanishing or overwhelming early designs.
- [ ] A "show unavailable technology" filter reveals future systems; it is off by default.
- [ ] Editing an available system updates the compiled design.


## Answer

The Systems local tabs now open a Systems panel (`systems-view.ts` pure model + `components/SystemsPanel.tsx`) beside
the fittings table:

- **Gating:** every catalogue installation in the tab's categories is offered only when its introduction month and
  the nation's unlocked technology allow it (`unavailableReason`). Unavailable installations are hidden by default, so
  an early design is not overwhelmed.
- **Locked technology is shown with a reason:** an off-by-default **Show unavailable technology** checkbox reveals
  them, disabled, each carrying its reason ("Unavailable until …", "Requires …").
- **Filter off by default**, per the ticket.
- **Editing:** an available installation has an Add action producing one ordinary `add_placement` edit in its first
  allowed zone (or the superstructure), so adding a system updates the compiled design; the fittings table below
  still edits fitted instances.
- **Deferred:** the model gates by design year and technology only — components carry no hull-type restriction, so
  hull-type gating is not modelled and is not faked.

**Tests** `systems-view.test.ts` (reason wording, hiding vs revealing unavailable items, adding one edit in a legal
zone, fitted counts) and `ShipbuildingWorkspace.test.tsx` ("Systems section": filter off by default with an available
installation offered, adding and undoing, revealing locked technology with a reason). **Commands:** systems model +
workspace suites pass; `pnpm typecheck` clean; `vp lint`/`vp fmt` clean.
