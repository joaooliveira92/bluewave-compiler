# 07: Pure part queries for agents and the designer (P1)

**Type:** implementation
**Status:** open
**Blocked by:** 02, 06
**Frontier:** no
**Requirements:** SPM-R15 · Stories 2, 17, 18, 19, 20

## What to build

An agent or the designer can ask the content directly:

- `resolvePart` — a part at a month, with its revision applied;
- `availableParts` — what is fittable at a month for a nation, and what became newly
  fittable;
- `partsForSlot` — every part whose interface and constraints a slot accepts;
- `lineage` — supersession ancestry and successors;
- `validateLoadout` — the fit findings from ticket 06;
- `loadoutCost` — each quantity component's value, basis, multiplier and contribution,
  with totals.

All queries are pure, deterministic and ordered by id. A new part becomes visible to every
matching slot with no compatibility list to maintain.

## Acceptance criteria

- [ ] Each query has design-compile-seam tests whose expectations come from hand-worked
      fixtures or the proposal's tables, not from recomputing the code.
- [ ] Adding a fixture part makes it appear in `partsForSlot` for every matching slot and
      in no other slot.
- [ ] `availableParts` reports the 1884 Whitehead revision as a change in that month.
- [ ] Outputs are id-ordered and identical across runs.
