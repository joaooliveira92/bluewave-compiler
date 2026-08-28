# INC-2 — Fleet chart shell: Map 2/3 | Drawer 1/3 with FleetWorldMap wrapper

**Type:** implementation
**Status:** open
**Blocked by:** INC-1
**Frontier:** no

**What to build:** The Fleet tab layout that replaces the `GeographyCard` text wall with the Admiralty chart. The chart reads as a chart, not an app panel, and the throwaway prototype can be deleted later.

**Spec:** `.scratch/fleet-movement-strategy-map/spec.md` (Layout & visual language; Reuse vs fork; User Stories 20,21,25,27)

## Acceptance

- [ ] `GeographyCard` 3-col `areas.join/edges.join` Card retired; `DivisionPicker` becomes compact 1-row filter strip above map (RadioGroup `p-3` + `areaName(division.areaId)`, 1-row scroll).
- [ ] New `FleetWorldMap` wrapper in `components/world-map/` forwards `state/route/overlay/onSelect/onRuler` to `WorldMapChart` (no fork, no `coastline/graticule/control/routePath` duplication), filtering `LAYERS` to `{ownership, routes, passages, possessions, fleets, labels}` all true (`initialMapPrototypeState`) and injecting per-division route memo hook.
- [ ] Desktop ≥1024px: `FleetScreen` = Map left 2/3 (`WorldMapChart` with `CHART.ocean` oklch 0.19 / `oceanDeep` vignette / `land` 0.30 / graticule / ink, floating `left-3 top-3` toolbar `oklch(0.16/0.85)`) | Drawer right 1/3 (Destination Select, ships/pending meta, Submit/Replace/Cancel, Refresh/Retry, MovementCommandsTable, notice live region). Narrow <1024px: stacked Map ~360px full-bleed + Drawer as Sheet via Order button; DivisionPicker 2-col grid.
- [ ] Empty states: `divisions.length===0` → strip `Empty No player division`; total geometry miss → map chrome `Empty No chart geometry` (unreachable with 1880 pack).
- [ ] Fleet chart imports only from `components/world-map/`; `screens/map-prototype/` import from Fleet is lint-blocked (eslint `no-restricted-imports`).
- [ ] Existing `useFleetScreen` / `FleetScreenView` / bridge `inspectFleetScreen`→`submitMovementCommand` contract unchanged (Submit disabled `busy || selectedDivision===null || destinationAreaId===null`).

## Notes

Wrapper reuses `WorldMapChart` 659 loc already promoted from `variants/VariantAChart`. Keep Admiralty palette deliberate (paper-chart read). Prototype artifact `prototype-02-layout.md` is the throwaway reference — do not fork coastline/projection/camera.
