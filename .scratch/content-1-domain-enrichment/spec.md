# Spec: CONTENT-1 domain enrichment

## What

For each domain, check whether the engine already treats it in its compiled
snapshot; if so, deepen the engine's compiled state model and its content
compiler so the compiled campaign snapshot consumes the richer researched
content for that domain. Work strictly domain by domain, one committed vertical
slice at a time, keeping lint / test / typecheck green at every step — no
"work fast and break things".

## Source of truth

The researched content lives per domain under `content/research/<domain>`
(schemas + per-scenario data). The engine's compiled snapshot lives in
`packages/campaign`. The compiler and content schemas live in
`packages/campaign`, `packages/content-schema`, `packages/content-compiler`.

## Ground rules

- **Diplomacy is out of scope** (kept blocked, B10c): do not enrich it and do
  not add diplomacy relations to reachable content.
- Each ticket is independent (no blocking edges) — they deepen disjoint parts
  of the snapshot.
- Each ticket ends with the deterministic snapshot hash lock updated and
  format / lint / typecheck / tests green.
- The compiler enriches from the researched domain data
  (`content/research/<domain>`), not from invented fields.

## Tickets

01 technologies, 02 world/geography, 03 nations/governments,
04 fleet, 05 shipbuilding, 06 resources/economy.

See `issues/`.