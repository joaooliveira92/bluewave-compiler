# 07: Pure part queries for agents and the designer (P1)

**Type:** implementation
**Status:** resolved
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
  it wraps `validateLoadoutFit` and must expose the unlocked-technology input that ticket 06
  could not evaluate (deferred from 06);
- `loadoutCost` — each quantity component's value, basis, multiplier and contribution,
  with totals.

All queries are pure, deterministic and ordered by id. A new part becomes visible to every
matching slot with no compatibility list to maintain.

## Acceptance criteria

- [x] Each query has design-compile-seam tests whose expectations come from hand-worked
      fixtures or the proposal's tables, not from recomputing the code.
- [x] Adding a fixture part makes it appear in `partsForSlot` for every matching slot and
      in no other slot.
- [x] `availableParts` reports the 1884 Whitehead revision as a change in that month.
- [x] Outputs are id-ordered and identical across runs.

## Resolution

Implemented in `packages/ship-design/src/partQueries.ts`; tests in
`test/partQueries.test.ts` (22, hand-worked fixtures through the strict schemas).

- **Queries.** `resolvePart`, `availableParts`, `partsForSlot`, `lineage`, `validateLoadout`,
  `loadoutCost`, all over a `PartCatalogue` (parts, slot templates, platforms).
- **Unlocked technology.** `FitInput.unlockedTechnologies` (also on `availableParts` and
  `validateLoadout`) adds finding `FIT_TECHNOLOGY_LOCKED` (`detail.missing`). When the input
  is absent technology is not evaluated. `availableParts` takes
  `previouslyUnlockedTechnologies` so a technology unlocked this month makes a part newly
  fittable.
- **`availableParts` changes.** `INTRODUCED` (`availableFrom`), `REVISED` (a revision's
  `from`, part available) and `RETIRED` (`availableUntil`) in the query month.
- **`partsForSlot`** decides by interface and constraints on the part alone.
  Constraints that need other entries (a mount's calibre needs its guns) are reported as
  `undecided`, never accepted. `massKgMax` is evaluated for one unit. Lifecycle, nation and
  technology belong to `availableParts`.
- **`loadoutCost`.** A nested entry's units are its parent's units times its `mountCount`.

## Deferred work

| Item | Owner |
| --- | --- |
| Platform availability windows (no schema field) | ticket 11 |
| Enforcing the technology requirement in `compileDesign` | ticket 11 |
