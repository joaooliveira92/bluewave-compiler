---
Type: task
Status: resolved
Blocked by: 05
---

# B-1 / 06 — Phase integration + save/load/replay + goldens

## Question

`battle_generation` phase in the month pipeline and persistence/end-to-end proof.

## Answer

Per spec INC-6: add `battle_generation` phase (order 7.5, rngAllowed) in
`@bluewave/phase-engine`; feed generated manifests/instances to `battle_resolution`
(unchanged); extend clone/persistence/replay; no-op path leaves new collections
absent so no-war hash is byte-identical (AC-12 review pin); golden regen with
ADR-0007 documented cause; 24-month AI smoke stays green.
