# Ticket 02 — Phase / Engine Integration Boundary

**Type:** decision
**Status:** resolved
**Blocked by:** 01

## Question

DESIGN-34 describes a monthly strategic submarine resolution with tactical
allocation, ASW, and friendly-fire. Should this slice wire a `submarine_operations`
phase into `phase-engine` and put `SubmarineStrategicAsset[]` / `SubmarineOperationsRecord[]`
on `CampaignSnapshot`?

## Decision

**No** — ship as a pure function set in `@bluewave/combat`
(`packages/combat/src/submarines/`), **not** wired into `phase-engine` or
`CampaignSnapshot` this sprint. Mirrors the B-5 (pure engine) → B-6 (authoritative
snapshot wiring) and C-2 sequencing: the strategic submarine engine ships as
explicit-input → explicit-output pure functions, independently callable from a
future phase-wiring sprint. No snapshot schema change; no new phase registered
even as a no-op stub (stricter than B-5, matches the C-1/C-2 precedent of
registering nothing until wiring is actually implemented). Goldens unchanged.

## Rationale / authority

- Keeps the slice engine-only and deterministic; no authoritative hash can move.
- Follows the accepted `@bluewave/combat` placement for strategic/monthly mechanics
  (`weather/strategic-state.ts` ADR-0022, `mines/` ADR-0033).
- The command/AI and phase-wiring surface is deferred to a later slice; this
  sprint ships the value/predicate/record layer, which is the piece with no
  missing dependency.
- `BattleResolver`/`StrengthCalculator`/existing engine files remain UNMODIFIED
  (integration-boundary proof test).
