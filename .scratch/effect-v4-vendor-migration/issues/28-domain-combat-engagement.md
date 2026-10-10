# 28 — Domain: `combat` engagement/foundation modules on runtime-free Effect idioms

**Type:** implementation
**Status:** open
**Blocked by:** 22 (`campaign`)
**Frontier:** no

## What to build

Adopt the runtime-free Effect subset across the remaining `@bluewave/combat`
modules: `contact`, `spotting`, `movement`, `tactical`, `generation`,
`battleResolution`, `simulation`, `submarines`, `weather`, and the top-level
files (`resolver`, `strength`, `targeting`, `withdrawal`, `battleEnd`,
`battleLedger`, `tacticalPipeline`, `tacticalClock`, `tacticalTime`,
`commandReach`, `commandQuantization`, `commandRecord`, `autoResolution`,
`movement`, `realism`, `fullSpeedStress`, `battleTurnAway`, `index`,
`reasonCodes`). Preserve pure math and reason codes.

## Required reading (self-contained)

- `.scratch/effect-v4-vendor-migration/spec.md` — proves **MIG-RUNTIME-1,
  MIG-DET-1**; "Runtime-usage policy".
- `packages/combat/src/**` (the modules above).
- `.scratch/effect-v4-vendor-migration/plan.md` §3.
- `docs/adr/ADR-0026-battle-auto-resolution.md`,
  `docs/adr/ADR-0033-c2-mine-warfare-scope-reason-codes.md` (context).

## Acceptance criteria

- [ ] The listed modules use runtime-free Effect subset idioms; structured
      failures typed via `Data.TaggedError` (`MIG-RUNTIME-1`).
- [ ] Runtime-free: no `Effect`/`Layer`/`ManagedRuntime`; no `Effect.run*`.
- [ ] Battle outcomes, records, and reason codes unchanged (any hash-surface
      change → ADR note, `MIG-DET-1`).
- [ ] Focused tests green; `pnpm --filter @bluewave/combat test` green;
      `pnpm typecheck` green.

## Notes

- This is the largest single module group; if a fresh context cannot hold it,
  split by subdirectory into child tickets that share this ticket's blockers,
  keeping the same acceptance criteria.
