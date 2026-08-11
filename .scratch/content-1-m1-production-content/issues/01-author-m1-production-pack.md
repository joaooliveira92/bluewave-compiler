# CONTENT-1 — 01: Author the M1/EARLY production pack (scen_1880)

## Question

Author the first production content pack at `content/production/1880/`
(`type: "production"`) containing the M1-era collections the `scen_1880`
anchor needs: countries, areas, routes, possessions, ports, technologies,
and the campaign collections (fleets, economies, constructions, research,
designs), grounded in the four `docs/research/content-1-*.md` notes, such
that it compiles deterministically through the existing compiler.

## Type

task

## Status

resolved

## Notes

- Content map + classification: `docs/research/content-0-content-map.md`.
- Research: world-geography, fleets-and-ship-classes, research-tech-tree,
  ship-classification-and-economy.
- Diplomacy (B10c blocked) is NOT authored into the reachable starting state
  (would be reachable without an accepted capability → DESIGN-55 §14 concern).
- Zero engine change; compile via desktop path (`runCompilation`) which wires
  campaign collections.

## Blocked by

None.

## Answer

Pack authored at `content/production/1880/` (`type: "production"`): 14
countries, ~100 areas, 35+ routes, ~70 possessions, ~95 ports, 34 EARLY
technologies (acyclic DAG), 16 designs, 22 fleets, 14 economies, 9
constructions, 14 research states. All `SUPPORTED_MECHANICAL`; diplomacy
intentionally omitted. Brief: `.ai/briefs/content-1-m1-production-content.md`.
Research: `docs/research/content-1-*.md`. Compiles via desktop path with the
campaign compiler.
