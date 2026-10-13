# 04: Central ship workspace — views, overlays, selection sync

**Type:** implementation
**Status:** open
**Blocked by:** 03
**Frontier:** yes

Source: `.scratch/shippbuilding-ui.md` §"Central ship workspace",
§"Important interaction patterns" (selection synchronization).

## What to build

Make the central ship visualization the primary interaction surface. Add a compact view
selector (Top, Side, Armor, Compartments, Firing arcs) and contextual overlay toggles (armor
zones, turret arcs, component footprint, center of mass, topside load, machinery layout,
structural conflicts), and wire selection in **both** directions: clicking an element on the
ship activates the matching inspector section/tab/editor, and selecting in the inspector
highlights the element on the ship.

## Acceptance criteria

- [ ] A view selector switches the ship visualization among Top, Side, Armor, Compartments,
      and Firing arcs.
- [ ] Overlay toggles independently control the listed overlays; they are not all shown at
      once.
- [ ] Clicking a turret/component on the ship activates the matching inspector section and
      local tab and focuses that editor (e.g. Turret A → Armament → Main battery → Turret A
      editor, with its firing arc shown).
- [ ] Selecting an item in the inspector highlights its element on the ship with a strong
      accent; related coverage appears as a translucent overlay.
- [ ] If a new screen↔selection contract is fixed here, an ADR records it.
- [ ] `pnpm snap` capture of a selected component with its overlay on the ship.
