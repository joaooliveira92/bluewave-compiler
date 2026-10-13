# 04: Central ship workspace — views, overlays, selection sync

**Type:** implementation
**Status:** resolved
**Blocked by:** 03
**Frontier:** no

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

- [x] A view selector switches the ship visualization among Top, Side, Armor, Compartments,
      and Firing arcs.
- [x] Overlay toggles independently control the listed overlays; they are not all shown at
      once.
- [x] Clicking a turret/component on the ship activates the matching inspector section and
      local tab and focuses that editor (e.g. Turret A → Armament → Main battery → Turret A
      editor, with its firing arc shown).
- [x] Selecting an item in the inspector highlights its element on the ship with a strong
      accent; related coverage appears as a translucent overlay.
- [x] If a new screen↔selection contract is fixed here, an ADR records it.
- [x] `pnpm snap` capture of a selected component with its overlay on the ship.

## Comments

- The view/overlay vocabulary is `panels/hull-plan/ship-view.ts` (pure: `SHIP_VIEWS`,
  `SHIP_OVERLAYS`, `overlaysOf`, `toggleOverlay`) and the drawing layers are
  `panels/hull-plan/ship-view-layers.tsx` (`ArmourZoneLayer`, `CompartmentLayer`,
  `MachineryLayoutLayer`, `MassMarkersLayer`). `ViewToolbar` renders them; `HullPlanPanel` gains
  `shipView`/`overlays` props that default to the Drawing Board's single top view, so that host is
  unchanged.
- "Armour" is spelled the British way to match the domain (`ArmourPanel`, `ARMOUR_REGIONS`).
- The armour and centre-of-mass overlays draw only what the model supports: the belt/citadel
  lengths are real but the model gives no station, so the band is drawn amidships and labelled a
  convention; the centre of gravity is the compiled `stability.lcgPermille`.
- The screen↔selection contract (mapping a `ShipEntity` to an inspector place, and back to its
  control) is ADR-0142. Fittings route through the existing `CATEGORY_PLACE`, so a new category
  gains a destination automatically.
- Bidirectional selection reuses the shared store: a ship click pins `selected` and opens the
  place; focusing a form group sets `linked`; the inspector's mount/fitting controls (added
  optionally to `BatteryPanel`/`PlacementsPanel`) pin `selected` and read back with a pressed
  state. Escape clears; a small banner names and clears the pinned element.
