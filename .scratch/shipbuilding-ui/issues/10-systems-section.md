# 10: Systems section

**Type:** implementation
**Status:** open
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
