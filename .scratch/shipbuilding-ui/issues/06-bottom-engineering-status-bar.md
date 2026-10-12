# 06: Bottom engineering status bar with breakdowns

**Type:** implementation
**Status:** open
**Blocked by:** 02
**Frontier:** yes

Source: `.scratch/shippbuilding-ui.md` §"The persistent bottom status bar".

## What to build

A persistent bottom strip exposes the engineering values that would otherwise be scattered
through the forms: displacement (current/capacity), cost, speed, range, stability, topside
load, and warning count. Clicking displacement/cost/stability opens a breakdown (weight by
group, cost by group, stability causes), hovering available weight shows committed versus
reserved, and values colour by constraint.

## Acceptance criteria

- [ ] The strip shows displacement (current/capacity), cost, speed, range, stability, topside
      load, and warning count, all from compiled design state.
- [ ] Clicking displacement opens a weight breakdown whose groups sum to current/capacity/
      remaining (e.g. Hull and fittings, Machinery, Armor, Armament, Ammunition, Accommodation,
      Incidental).
- [ ] Clicking cost opens a cost breakdown; clicking stability opens the relevant causes.
- [ ] Hovering available weight distinguishes committed from reserved weight.
- [ ] Invalid values turn red, values approaching a constraint turn amber, normal values stay
      neutral rather than aggressively green.
