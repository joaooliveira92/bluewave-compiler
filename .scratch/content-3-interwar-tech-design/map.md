# Wayfinder Map: CONTENT-3 — INTERWAR-Band Technology & Ship-Design Continuation

## Destination

Author the next slice of the `scen_1880` production pack (`content/production/1880/`,
`type: "production"`): the **INTERWAR era band (Jan 1920 – Dec 1939)** research-
technology tree and ship-design templates, continuing the EARLY→PRE_WAR DAG from
CONTENT-1/CONTENT-2, with **zero engine change**. Continuing pattern:
`SUPPORTED_MECHANICAL` because Research (B10b, DESIGN-20) and Ship Design (B10b,
DESIGN-21) are `ACCEPTED`.

## Scope decision (ticket 01)

CONTENT-3 locks the **technology + ship-design** slice of the INTERWAR band only,
on the same grounds as CONTENT-2: those owning capabilities are accepted, the
compiler consumes them additively, and prereqs live in the authored set. The
INTERWAR era's novel *unit* families — **carriers & aircraft (M4), radar &
electronics (M5), missiles (M5), amphibious ops ($)** — are deferred, not
descended into, because authoring a reachable research tech in those fields would
reference an unsupported unit family (DESIGN-55 §14).

## Notes

- Canonical sources: `README.md`, `.ai/ENGINEERING-CONTRACT.md`, DESIGN-55 §11
  (INTERWAR = Jan 1920–Dec 1939), §12 (classification), §13/§14 (unreachability),
  DESIGN-20, DESIGN-21, DESIGN-03 §6.
- Content conventions inherited from CONTENT-1/2: acyclic DAG,
  `category` = era band, `researchFieldId` = one of fifteen fields,
  `prerequisites:[{techId}]`, `year` 1880–1970, `discoveryWeight` 1..1e6;
  designs use integer `displacementKg`/`speedUms`/`armorBeltUm` (compiler `SafeInt`).
- Research rule: research, don't invent — every dated claim grounded
  (`docs/research/content-3-interwar-era-tech-and-design.md`).
- Classification consistency (matches the merged CONTENT-1/2 rule):
  research techs are authored in the ten fields with established DAG tails
  (HULL_CONSTRUCTION, MACHINERY, SHIP_DESIGN, GUNNERY, FIRE_CONTROL, TORPEDOES,
  MINES_AND_ASW, SUBMARINES, INFRASTRUCTURE, DAMAGE_CONTROL); the deferred unit
  families (AVIATION, CARRIER_OPERATIONS, RADAR_AND_ELECTRONICS, MISSILES,
  AMPHIBIOUS_OPERATIONS) get no INTERWAR techs here, regardless of their
  historical reality, because their engine units are not accepted.

## Decisions so far

- [01-interwar-scope](issues/01-interwar-scope.md) — CONTENT-3 = INTERWAR tech +
  design continuation; carriers/aircraft/radar/missiles/amphibious deferred.
- [02-interwar-tech-tree](issues/02-interwar-tech-tree.md) — 24 grounded INTERWAR
  techs across 10 fields, acyclic, seeded on PRE_WAR tails.
- [03-interwar-designs](issues/03-interwar-designs.md) — 10 real-class design
  templates with grounded specs.
- [04-reachability-classification](issues/04-reachability-classification.md) —
  all items `SUPPORTED_MECHANICAL`; deferred families not authored (§14).
- [05-brief](issues/05-brief.md) — milestone brief landed at
  `.ai/briefs/content-3-interwar-tech-design.md`.

## Out of scope

- Authoring the YAML records (that is the CONTENT-3 implementation sprint).
- Any new mechanic (Track A/B/C/D/E).
- AVIATION / CARRIER_OPERATIONS / RADAR_AND_ELECTRONICS / MISSILES /
  AMPHIBIOUS_OPERATIONS INTERWAR content (M4/M5/$ — deferred).
- Deployment (DESIGN-25) and blockades (B10c) — still deferred, mechanics-gated.
- `ScenarioSupportManifest`, era-coverage matrix, release validation (REL-1).