# 12: Review section

**Type:** implementation
**Status:** open
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
