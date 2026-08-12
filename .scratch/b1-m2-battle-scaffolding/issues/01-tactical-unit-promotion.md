---
Type: task
Status: resolved
Blocked by:
---

# B-1 / 01 — Tactical-unit promotion + ship-type classifier

## Question

Promote campaign ship data into a reachable tactical format.

## Answer

Per spec INC-1: add `CanonicalShipType` classifier (DESIGN-22 predicates,
`ship_type_classifier_v1`), `TacticalShipUnit`, and `promoteTacticalUnit` in
`@bluewave/combat`. No snapshot schema change. Extend the production-pack test
(AC-1/AC-14: every ship in `content/production/1880/fleets.yaml` promotes, no
ambiguity). ADR B-1-1 + B-1-2 gate this increment.
