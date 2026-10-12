# 32 — `phase-engine` battle + replay modules

**Type:** implementation
**Status:** resolved
**Blocked by:** none
**Frontier:** no

## What to build

Adopt Effect idioms across the `@bluewave/phase-engine` battle/replay modules:
`battles`, `battlePhases`, `replay`, `tacticalReplay`. Preserve replay
determinism and battle-integration semantics.

## Required reading (self-contained)

- `.scratch/effect-v4-vendor-migration/spec.md` — proves **MIG-RUNTIME-1,
  MIG-DET-1**; "Determinism gate demoted".
- `packages/phase-engine/src/{battles,battlePhases,replay,tacticalReplay}.ts`;
  `docs/research/effect-v4-runtime-determinism.md` §3.5–§3.6.

## Acceptance criteria

- [ ] The listed modules use Effect idioms appropriate to orchestration; typed
      errors replace ad-hoc failures (`MIG-RUNTIME-1`).
- [ ] Replay produces identical outcomes for identical inputs/seeds; no ambient
      randomness or wall-clock reads; determinism hygiene followed (`MIG-DET-1`).
- [ ] Any replay-hash drift is recorded as an ADR note (record, not block).
- [ ] `pnpm --filter @bluewave/phase-engine test` green; focused replay/
      determinism tests green.

## Notes

- The cross-process harness stays informational (`MIG-DET-1`); do not gate on it.

## Comments

### Audit note (ticket 00, 2026-10-12)

**Closed — not needed.** `battles`, `battlePhases`, `replay` and
`tacticalReplay` contain no `throw`, no async and no IO; replay determinism is
already covered by the existing harness. Nothing to adopt.
