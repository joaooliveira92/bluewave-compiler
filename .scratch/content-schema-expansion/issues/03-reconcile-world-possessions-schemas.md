# CONTENT-SCHEMA — 03: Reconcile the World and Possessions schemas

## Question

The research `world.ts` (AreaType `home_area/sea_zone/choke_point/canal_zone`,
Climate, Area, Port, Canal, WorldAreasPack, PortsCanalsPack) and
`possessions.ts` shapes replace the legacy `area`/`port`/`possession`/`route`
schemas. Decide the canonical field sets and how production
`areas.yaml`/`ports.yaml`/`possessions.yaml` reach them — enrich from the
research world data vs keep legacy fields optional. Establish whether the
research world data set matches production (area/port/possession counts and
identities — a facts check on `content/research/world/` against
`content/production/1880/`).

## Type

grilling

## Status

open

## Notes

- Research source: `content/research/schema/world.ts` + `possessions.ts`.
- Production source: `content/production/1880/{areas,ports,possessions}.yaml`
  plus the campaign compiler's `buildWorldState` reads.
- Settlement 5 (shape wins, identifiers/locked values win) governs; settlement
  8 (replace + keep the pipeline green) bounds production fallout.
- Invoke `/grilling` and `/domain-modeling`.

## Blocked by

None.
