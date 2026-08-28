# INC-4 — Hover tooltip & per-division route lines (committed + preview)

**Type:** implementation
**Status:** open
**Blocked by:** INC-3
**Frontier:** no

**What to build:** The hover intelligence and auditable route lines that make the chart strategic: a pinned tooltip contract and gold per-division lines correlated by `commandId`.

**Spec:** `.scratch/fleet-movement-strategy-map/spec.md` (Tooltip, Pending route lines; User Stories 7–11)

## Acceptance

- [ ] Tooltip built from live `FleetScreenView` at `labelAnchor` via `projectPoint`, rendered React `absolute` (not SVG `<title>`, `pointerEvents:none` text layer), pinned contract:
  - title `areas.find(id).name`
  - controller `NationId→campaignNationLabel/nationFill` (null → "Unclaimed")
  - ports `ports.filter(areaId) → name (level/capacity)` (`FleetPort.capacity=level`)
  - stationed `divisions.filter(areaId) → fleetName · divisionId · ships.length` (player-only v1)
  - neighbours `areaEdges.filter(from===id||to===id) → → name + C/S + open/closed + distance km` (compiled distance; fallback nauticalMiles at 0,0)
  - pending `pendingRouteFor → pending from→to (submitted r{revision})`
- [ ] Committed line per division with `pendingRouteFor !== null`: dark under-stroke `oklch(0.2 /0.6) 6 round` + gold over-stroke `oklch(0.85 0.16 85) 2.5 dash 10 6 round`, one per division (multiple gold lines allowed), matches `MovementCommandsTable` row.
- [ ] Preview for selected division when `destinationAreaId !== null && !== division.areaId` and no committed line already equals that `toAreaId`: fainter same dash `opacity 0.55 width 2` no under-stroke, straight `M…L…` between label anchors (honest direct edge).
- [ ] Hover correlation: hovering committed line highlights table row and vice-versa via shared `commandId`; no preview when equals committed destination; edge-label distance not rendered.
- [ ] Tests at Fleet ordering seam: tooltip content (controller/ports/stationed/neighbours/distance/pending), committed per-division lines, preview fainter + suppression, `commandId` correlation.

## Notes

Distance surfaces only in tooltip (spec rejects edge labels). Controller uses `campaignNationHue` ramp from INC-1.
