# 06: Bottom engineering status bar with breakdowns

**Type:** implementation
**Status:** resolved
**Blocked by:** 02
**Frontier:** no

Source: `.scratch/shippbuilding-ui.md` §"The persistent bottom status bar".

## What to build

A persistent bottom strip exposes the engineering values that would otherwise be scattered
through the forms: displacement (current/capacity), cost, speed, range, stability, topside
load, and warning count. Clicking displacement/cost/stability opens a breakdown (weight by
group, cost by group, stability causes), hovering available weight shows committed versus
reserved, and values colour by constraint.

## Acceptance criteria

- [x] The strip shows displacement (current/capacity), cost, speed, range, stability, topside
      load, and warning count, all from compiled design state.
- [x] Clicking displacement opens a weight breakdown whose groups sum to current/capacity/
      remaining (e.g. Hull and fittings, Machinery, Armor, Armament, Ammunition, Accommodation,
      Incidental).
- [x] Clicking cost opens a cost breakdown; clicking stability opens the relevant causes.
- [x] Hovering available weight distinguishes committed from reserved weight.
- [x] Invalid values turn red, values approaching a constraint turn amber, normal values stay
      neutral rather than aggressively green.

## Comments

- Implemented by `engineering-status.ts` (pure readouts from `WorkshopView`: values, tones,
  breakdown rows, hint lines) and the `components/` leaves (`EngineeringStatusBar`, `ReadoutItem`,
  `ReadoutDetail`, `ReadoutRows`, `ReadoutValue`), wired into `ShipbuildingWorkspace`.
- Weight breakdown renders the ledger's canonical categories (the domain's own groups); the
  displayed groups are largest-remainder-adjusted to whole tonnes so they **sum exactly to the
  displayed current displacement**, with a footer carrying current/capacity/remaining. The
  source's named groups are illustrative ("e.g."), so the canonical partition is kept rather
  than inventing a second grouping that could misstate the ledger.
- Cost breakdown comes from a new `WorkshopView.forecast.costBreakdown` (the existing
  `computeCost` lines, exposed rather than recomputed in the UI).
- Cost stays neutral: the design model has no budget/target constraint, so there is no
  "approaching" band to colour.
- Topside load is shown in m² (deck area, the domain's own unit), not the diagram's illustrative
  tonnage.
- Stability causes are the `STABILITY_*` findings plus the GM/KB/BM/KG terms.
- Snap: `pnpm snap --save /tmp/bw-save --click "Shipbuilding"` — strip present, console clean,
  `idle mutations/s: structural=0 attributes=0`.

