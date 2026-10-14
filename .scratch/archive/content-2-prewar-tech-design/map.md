# Wayfinder Map: CONTENT-2 — PRE_WAR-Band Technology & Ship-Design Continuation

## Destination

Author the next slice of the `scen_1880` production pack (`content/production/1880/`,
`type: "production"`): the **PRE_WAR era band (Jan 1900 – Dec 1919)** technology
tree and ship-design templates, continuing the EARLY DAG written in CONTENT-1,
with **zero engine change**. This is `SUPPORTED_MECHANICAL` content because the
owning capabilities — Research (B10b, DESIGN-20) and Ship Design (B10b,
DESIGN-21) — are `ACCEPTED` (A-0b PASS).

## Scope decision (ticket 01)

CONTENT-2 locks the **technology + ship-design** slice of the PRE_WAR band only,
because those own capabilities are accepted. The other candidate slices named in
`SPRINT-PLAN.md` — **deployment** (DESIGN-25, unassigned) and **blockades**
(B10c, blocked on the victory-classification decision request) — are
**explicitly deferred**, not descended into. Authoring them now would expand into
a deferred/blocked subsystem with unprovable reachability, which the autonomous
agent contract forbids. They are logged out-of-scope here.

## Notes

- Canonical sources: `README.md`, `.ai/ENGINEERING-CONTRACT.md`, DESIGN-55 §11
  (era bands), §12 (classification), §13/§14 (unreachability), DESIGN-20
  (research), DESIGN-21 (ship design), DESIGN-03 §6 (tech variation).
- Content conventions inherited from CONTENT-1
  (`.ai/briefs/content-1-m1-production-content.md`): acyclic DAG, integer
  `speedUms`/`displacementKg`/`armorBeltUm` for designs (campaign compiler
  normalizes via `SafeInt`), `category` = era band, `researchFieldId` = one of
  the fifteen canonical fields, `prerequisites:[{techId}]`, `year` 1880–1970,
  `discoveryWeight` 1..1e6.
- Research rule: **research, don't invent.** Ground every dated PRE_WAR claim in
  a high-trust source named per item (see `docs/research/content-2-prewar-era-tech-and-design.md`).
- The fifteen research fields (content-schema `research-fields.ts`):
  HULL_CONSTRUCTION, MACHINERY, SHIP_DESIGN, GUNNERY, FIRE_CONTROL, TORPEDOES,
  SUBMARINES, MINES_AND_ASW, AVIATION, CARRIER_OPERATIONS, RADAR_AND_ELECTRONICS,
  MISSILES, AMPHIBIOUS_OPERATIONS, INFRASTRUCTURE, DAMAGE_CONTROL.
- Reachability: a PRE_WAR research tech is reachable in `scen_1880` (1092-month
  campaign through Dec 1970) and is `SUPPORTED_MECHANICAL` because the Research
  mechanic is accepted and every prerequisite is in the authored set. This
  matches CONTENT-1's treatment of TORPEDOES/SUBMARINES/MINES EARLY techs.
- Deferral note: AVIATION / CARRIER_OPERATIONS PRE_WAR techs (hisptorically real
  scout-aviation 1911–1919) are **deferred to the M4/D-track content sprints**
  because the aviation *unit* mechanism is not yet accepted; authoring them now
  would create a research tech referencing an unsupported unit family. Same for
  RADAR/MISSILES (historical firsts postdate 1919 anyway).

## Decisions so far

- [01-prewar-scope](issues/01-prewar-scope.md) — CONTENT-2 = PRE_WAR tech + design
  continuation only; deployment/blockade deferred. `SUPPORTED_MECHANICAL`
  (=Research/Design accepted).
- [02-prewar-tech-tree](issues/02-prewar-tech-tree.md) — enumerated PRE_WAR tech
  items by field with grounded years/sources; acyclic, seeded on EARLY tails.
- [03-prewar-designs](issues/03-prewar-designs.md) — production design templates
  to author (real hulls/classes) with integer stat constraints.
- [04-reachability-classification](issues/04-reachability-classification.md) —
  every PRE_WAR item `SUPPORTED_MECHANICAL`; aviation/carrier deferred to avoid
  unreachable-locked content; tech-variation profiles verify the manifest.
- [05-brief](issues/05-brief.md) — milestone brief landed at
  `.ai/briefs/content-2-prewar-tech-design.md`.

## Out of scope

- Authoring game content YAML (that is the CONTENT-2 implementation sprint the
  brief founders).
- Any new mechanic (Track A/B/C/D/E).
- Deployment (DESIGN-25) and blockade (B10c) content — deferred, mechanics-gated.
- AVIATION / CARRIER_OPERATIONS PRE_WAR techs and all M4+ unit content.
- `ScenarioSupportManifest`, era-coverage matrix, release-validation report (REL-1).