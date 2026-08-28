# INC-1 — Campaign geometry seam & coastline asset promotion

**Type:** implementation
**Status:** open
**Blocked by:** none
**Frontier:** yes

**What to build:** The live-data seam that lets the Admiralty chart render real 1880 topology. Topology stays `snapshot.world` (areas/routes/ports/distances via `buildFleetScreenView`); presentation stays a new `AREA_GEOMETRY: Record<AreaId,{ring,label,tile?}>` join table keyed by `AreaId` with unprojected lon/lat so projection remains a toggle.

**Spec:** `.scratch/fleet-movement-strategy-map/spec.md` (Implementation Decisions: Live data contract & Coastline asset; User Stories 7,8,26)

## Acceptance

- [ ] `AREA_GEOMETRY` introduced keyed by real `AreaId` (`FleetArea.id`) with `{ring: [lon,lat][], label: [lon,lat], tile?: [col,row]}` unprojected; `projectionById`/`ringToPath` stay render-time.
- [ ] New shared helper `components/world-map/campaign-geometry` extracted from `campaign-map-join` holding `joinWorldMap`/`fixtureAnchor`/`campaignNationHue`/`campaignNationLabel`/`EMPTY_LIVE_OVERLAY`; both `inspectMap` and `inspectFleetScreen` derive `LiveWorldMapOverlay` via same helper — no new bridge command, no second IPC from Fleet.
- [ ] Directed `FleetAreaEdge` → undirected chart edges derived at memo time (dedup + attach `passage` when pair matches `PASSAGES_BY_ID`); port `level>=7 → major 5 else minor 3.5`; fleet `divisionId↔id`/`areaId↔area`/`ships.length↔ships` alignment pinned.
- [ ] Missing geometry fallback: real `AreaId` with no entry renders label-only at 0,0 with dev `console.warn` + translucent wash `oklch(0.55/0.08)` — never crash or blank; graduates when authored.
- [ ] Coastline promoted from ~6 MB TS import to fingerprinted `public/coastline-10m.json` (10m tier, Natural Earth public domain) lazy `fetch` singleton `json()` cached in module, not `import`; no `d3-geo`/`topojson-client` runtime (40-line decoder stays in `bake-coastline.ts`); author-time bake `pnpm tsx bake-coastline.ts 10m` retained; output stays unprojected.
- [ ] Bundle delta measured: `du -h apps/desktop/dist` before/after shows ~5–6 MB removed from renderer chunk; `buildFleetScreenView`/`FleetScreenProjection` remain pure deterministic (repeat render identical).
- [ ] Tests at geometry-join seam: join over `AREA_GEOMETRY`, directed→undirected conversion, `level→base`, missing fallback, and singleton fetch (mocked), not via full Fleet render.

## Notes

Reuse `prototype-coastline.ts` 5969962 bytes, `prototype-world.ts` 36-area shape, and `campaign-map-join.test.ts` as prior art. Keep `CONTEXT.md` Nation/NationId/tag vocabulary. This is the prefactor — every later slice depends on it.
