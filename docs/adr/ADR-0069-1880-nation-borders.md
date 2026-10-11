# ADR-0069: 1880 borders for the playable nations (presentation layer)

## Status

accepted locally; **licence sign-off pending before any release**.

## Context

The world map should show where each playable nation's territory lay in 1880. The
repo had only a modern coastline (Natural Earth, public domain) and sea areas.
Modern borders are wrong for 1880 (Germany, France, Austria-Hungary, Italy and
Russia all differ), so they cannot be derived from the coastline data.

Candidates checked:

| Source | Covers 1880 | Licence | Notes |
| --- | --- | --- | --- |
| aourednik/historical-basemaps `world_1880.geojson` | yes | GPL-3.0 | "work in progress"; world-scale; each feature has a border-precision grade |
| CShapes 2.0 | no (starts 1886) | GPL (>= 2) | accurate but six years late |
| Natural Earth admin-0 | no (modern) | public domain | wrong for 1880 |

## Decision

- Bake the 1880 features of the **playable nations only** (`isPlayable: true` in
  `content/production/1880/countries.yaml`: uk, germany, usa, japan, france, italy,
  russia, austria_hungary, spain, qing) from `world_1880.geojson` with
  `bake-borders.ts`, simplified to 0.05 degrees, into `borders-1880-data.ts` (about
  70 KB, 5.5k points). Territories a nation held are included under it (for
  example British Raj under uk, Algeria under france, Taiwan under qing) because
  the dataset records them by `SUBJECTO`.
- Draw them in `CoastlineCanvas` after the land, with `source-atop`, so a wash and
  line appear only where land already is. The source is coarser than the 10m
  coastline; clipping keeps its coastal edges out of the sea.
- Presentation only: the engine, content pack and golden files never read it.
  Non-playable powers (Ottoman Empire, Netherlands, Portugal, Brazil) are not
  drawn. Toggle: map layer "1880 borders".

## Consequences

- **Licence (open):** the source is GPL-3.0. Whether baked, simplified coordinates
  carry that obligation into a distributed game is a legal question this ADR does
  not settle. Before release either obtain sign-off, or replace the data
  (re-bake from a permissively licensed source; the bake script and data file are
  the only things to swap) or remove the layer.
- **Accuracy:** the data is world-scale and approximate. Fine at world and region
  zoom; land borders look crude when zoomed in past a few hundred nm.
- Adding a playable nation means adding a row to `NATIONS` in the bake script and
  re-baking; `borders-1880-data.test.ts` fails if the two lists drift apart.
