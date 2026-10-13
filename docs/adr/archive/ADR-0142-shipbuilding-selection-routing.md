# ADR-0142: Shipbuilding screen ↔ selection routing

## Status

Accepted (2026-10-12).

## Context

The Shipbuilding workspace (ADR-0141) hosts the same designer as the Drawing
Board, but navigates it differently: a design map of seven sections, each with a
small set of local tabs, instead of five task tabs. The shared selection store
already models *what* on the ship is selected (a section, a fitting, a machinery
room, the whole ship), but the Drawing Board's own drawing-to-form routing
(`selection/navigation.ts`) targets the Drawing Board's tabs and panels. Ticket
04 makes the central ship the primary interaction surface and asks selection to
work both ways — click a turret on the ship to open its editor, select a fitting
in the inspector to light it on the ship.

## Decision

1. **A screen-local routing table.** `screens/shipbuilding/selection.ts` owns the
   screen's contract: `placeForEntity` maps a selected `ShipEntity` to an
   inspector place (`InspectorPlace` = section + local tab), and
   `findEntityControl`/`focusEntityControl` map the entity back to the control
   that edits it, so focus can follow a click on the ship. The Drawing Board's
   `selection/navigation.ts` is unchanged; the shared store, `linkedEntities`
   and the `data-ship-link`/`data-battery`/`data-placement` attributes stay the
   common mechanism.
2. **Fittings route by category.** A fitting goes to the tab that lists, adds and
   judges its category (`CATEGORY_PLACE`, already exhaustive over
   `ComponentCategory`). Sections, machinery rooms and the whole ship have fixed
   homes. A design that no longer contains the entity routes to nothing.
3. **Views and overlays are presentation.** The central workspace offers five
   views (Top, Side, Armour, Compartments, Firing arcs) and seven independent
   overlay toggles (armour zones, turret arcs, component footprint, centre of
   mass, topside load, machinery layout, structural conflicts). They live in
   `panels/hull-plan/ship-view.ts`, are held in screen state, and never touch the
   design. The Drawing Board passes neither and keeps its single top view.
4. **The inspector lights the ship, pinned or related.** Focusing a form group
   about ship elements sets the store's `linked` slice (the drawing's
   translucent coverage); clicking a mount or fitting control pins the entity in
   the `selected` slice (the strong accent). Both are presentation only.

## Consequences

- A second host of the designer has its own navigation contract without forking
  the drawing or the store; the Drawing Board is untouched behaviourally.
- A new fitting category automatically gains a destination, because
  `CATEGORY_PLACE` is exhaustive over the domain.
- Overlays that no design data supports yet (a spatial armour or centre-of-mass
  drawing) render nothing rather than a fabricated position; the source extent
  they *do* have is drawn schematically and labelled as a convention.
