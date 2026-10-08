# INC-3 — Click-to-order: area→destination and marker↔radio with adjacency hint

**Type:** implementation
**Status:** open
**Blocked by:** INC-2
**Frontier:** no

**What to build:** Spatial ordering — clicking the chart sets destination, clicking a fleet selects the division, with honest legality (engine decides) and tappable affordances.

**Spec:** `.scratch/fleet-movement-strategy-map/spec.md` (Implementation Decisions: Click area, Click marker, Batch deferred; User Stories 1–6,27)

## Acceptance

- [ ] Click any area path single-sets `useFleetScreen.destinationAreaId` (same `useState<string|null>`) so `submitMovementCommand`/`replaceMovementCommand` fire via `bridge.campaign.execute({divisionId, fromAreaId: division.areaId, toAreaId})` unchanged; shift-click follows `pushRuler` ruler semantics as optional measurement, not ordering path; direct-edge preview only (multi-hop `routeBetween` deferred).
- [ ] Whole-world selectable: renderer never gates legality; non-adjacent fill α 0.06 / stroke 0.9 oklch, adjacent to `selectedDivision.areaId` via `areaEdges` renders gold ring `strokeWidth 2 oklch(0.85 0.16 85)`; no client `isAdjacent()` check, no disabled wash.
- [ ] Fleet marker ↔ radio single source: `selectedDivisionId` sole state; marker rect 22×16 rx3 + ships count, hit 28×28 invisible rect, selected adds `CHART.ink 2.5 + glow oklch(0.85 0.16 85 /0.35)`; radio checks marker and vice-versa; drag suppresses click via `camera.isDraggingRef`.
- [ ] Stacking at shared `areaId`: offset `(index%3)*16-16` for 1–3, 4th+ collapses to `+N` pill with tooltip listing hidden `divisionId`s.
- [ ] Single-selection only; no batch "Issue to selected" button (`transportRequestId`/`expectedRevision` per-division contract unchanged).
- [ ] Tests at Fleet ordering seam (mocked `window.bluewave` bridge): click area sets destination + Submit payload, whole-world still sets, gold hint only on adjacent, marker↔radio sync, hit rect, stacking +N, drag suppress.

## Notes

Follow `fleet-screen-state.test.ts` + `FleetScreen` hook mock pattern. `pendingRouteFor` stays audit source. Do not add legality badge — rejection via `commandNotice`.
