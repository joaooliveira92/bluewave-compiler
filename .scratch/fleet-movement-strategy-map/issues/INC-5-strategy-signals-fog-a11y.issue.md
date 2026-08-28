# INC-5 — Strategy signals, fog & a11y fallback

**Type:** implementation
**Status:** open
**Blocked by:** INC-2
**Frontier:** no

**What to build:** Always-on strategic signals and honest fog, plus the keyboard/a11y path that keeps ordering reachable without a pointer. Runs parallel with INC-3 after the shell.

**Spec:** `.scratch/fleet-movement-strategy-map/spec.md` (Strategy signals & fog; Fallback & a11y; User Stories 12–19)

## Acceptance

- [ ] Ownership wash always-on α 0.18 idle / 0.36 selected via `areaControl→nationFill/campaignNationHue` (same hue ramp as sheet), contested hatch `6 4`; 1880 UK global vs GER home-only reads without toggle.
- [ ] Passages always-on: `EDGES.filter(passage)` midpoint C/S circle 7px (`open oklch 0.28 / closed 0.36 0.11 25`) + edge `open 0.3 solid / closed 0.55 dash 5 4`; Suez `sea_red_sea↔ott_eg_coast 160km canal` gating visible; no passage toggle.
- [ ] Fleets/ports player-only: `drawnFleets` rect + `drawnPorts` major 5 / minor 3.5 with `strokeFor(owner)`, filtered by `playerSlotId`; allied/neutral/enemy fleets and neutral ports not rendered v1.
- [ ] Routes: whole-world faint `oklch(0.75/0.35) 0.9` + gold adjacent `width 2 oklch(0.85 0.16 85)` + per-division gold lines as signal; no adjacent-only hide toggle; `LAYERS.routes` true; no legality badge (renderer never decides; `commandNotice` is rejection).
- [ ] Fog player-only v1 (no enemy fleet on chart; deferred spotting-gated follow-up recorded in Out of scope); label thinning `bounds>26000` big + `zoomBand≥1` all / `≥2` port names.
- [ ] `OrderSection` Select stays as fallback: `value===destinationAreaId`, `onValueChange===setDestinationAreaId`, same disabled guard; tab order Division strip (radio) → `WorldMapChart role=application aria-label="World map"` → OrderSection; within chart arrow cycles `areas` sorted id, Enter sets destination, Esc clears, no F1 steal.
- [ ] Live region under OrderSection announces `Division {fleetName} ({divisionId}) at {areaName}, {ships.length} ships. Destination {areaName}. {Pending … / No pending route}.`

## Notes

Label thinning and wash opacities are contract-pinned — assert them. Enemy visibility graduates only when B-2/B-5 spotting constants land.
