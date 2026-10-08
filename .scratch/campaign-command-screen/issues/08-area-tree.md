# Area tree hierarchy and Ships/Possessions

**Type:** grilling
**Status:** resolved
**Blocked by:** 01

## Question
The RTW3 tree groups areas under regions (e.g. The Mediterranean expands). Parity ticket 03 shipped a flat filterable list because the content has no hierarchy. Decide whether to add a region grouping (content vs derived), what Ships vs Possessions list, and its relation to map selection/focus and area drawer.

## Answer

Owner asked the orchestrator to proceed (2026-10-08); decided by the orchestrator. Region grouping is **presentation-layer**, not engine/content: a renderer table maps each area id to a display region (Northern Europe, The Mediterranean, Indian Ocean, ...) with an exhaustiveness test over the compiled 1880 areas, so a new area without a region fails the test. No change to `areas.yaml`, so no golden/hash impact. The tree has regions as expandable nodes (areas under them), Ships toggle lists areas with the player's ships (count badge), Possessions lists player-controlled areas/ports. Selecting a node focuses the map and opens the area drawer.
