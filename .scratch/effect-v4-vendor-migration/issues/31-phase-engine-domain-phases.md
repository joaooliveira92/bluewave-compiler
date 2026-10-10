# 31 — `phase-engine` domain phases

**Type:** implementation
**Status:** open
**Blocked by:** 30 (`phase-engine` foundation)
**Frontier:** no

## What to build

Adopt Effect idioms across the `@bluewave/phase-engine` domain phase modules:
construction (`constructionFunding`, `constructionOrder`,
`constructionPackages`, `constructionPhase`, `constructionRevision`,
`rebuildProjects`, `reviseProject`, `startRebuild`), economy (`economyPhases`,
`financial-ledger`, `budget`-adjacent), research (`research`,
`designStudies`, `designVersion`), diplomacy (`diplomacy`,
`divisionCommands`), events, validation (`validationPhases`,
`orderEligibility`), weather (`weatherPhase`), and `aircraft`/
`carrier-operations` phase wiring. Preserve phase semantics and reason codes.

## Required reading (self-contained)

- `.scratch/effect-v4-vendor-migration/spec.md` — proves **MIG-RUNTIME-1,
  MIG-DET-1**.
- The `packages/phase-engine/src/*.ts` files listed above.

## Acceptance criteria

- [ ] The listed modules use Effect idioms appropriate to orchestration/IO;
      typed errors replace ad-hoc failures (`MIG-RUNTIME-1`).
- [ ] Phase order, outcomes, and reason codes unchanged; deterministic
      behavior preserved (`MIG-DET-1`).
- [ ] `pnpm --filter @bluewave/phase-engine test` green; `pnpm typecheck` green.

## Notes

- Split into child tickets by phase group if a fresh context cannot hold it,
  sharing this ticket's blockers.
