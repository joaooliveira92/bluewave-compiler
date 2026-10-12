# INC-2 — Project status model + save migration

**State:** RESOLVED · **Frontier:** yes · **Blocked by:** none
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R7) · **ADR:** project-status model + save migration (ADR-0129)

## What to build

Make the engine's dockyard-project status the full DESIGN-23 §2 set and enforce its transition table,
so halt, delay, acceleration and impoundment have somewhere to live. This is the shared enabler for
every steering behaviour (INC-3, INC-4, INC-10).

## Acceptance criteria

- [ ] The project status is exactly DESIGN-23 §2: `PLANNED`, `AUTHORIZED`, `AWAITING_CAPACITY`,
      `ACTIVE`, `HALTED`, `DELAYED`, `ACCELERATED`, `COMPLETED`, `CANCELLED`, `IMPOUNDED`.
- [ ] The legal transition table is enforced in one place; an illegal transition fails with
      `INVALID_DOCKYARD_PROJECT_TRANSITION` and changes no state. Terminal statuses are `COMPLETED` and
      `CANCELLED`; `IMPOUNDED` stays non-terminal until an explicit custody/title outcome.
- [ ] The save-compatibility version is bumped per ADR-0113; a pre-change save is either migrated by a
      registered read migration or rejected with `PERSISTENCE_COMPATIBILITY_MISMATCH` (record which, in
      the ADR).
- [ ] Persistence round-trip at the new version; determinism: status presence does not alter unrelated
      snapshot hashes.

## Notes for implementator

Prefactor ticket — "make the change easy". Add the enum + transitions + migration, no new commands.
The status enum today is the narrow `PLANNED|AUTHORIZED|ACTIVE|COMPLETED`; extend the single
authoritative union rather than adding parallel flags. Proving tests: the transition table (legal and
illegal), a round-trip, and a migration/rejection test.

## Answer

The DESIGN-23 §2 status model is in place, enforced in one place, with the save-compatibility bump.

- `@bluewave/campaign` gains `constructionStatus.ts`: the ten-status
  `ConstructionProjectStatus`, `CONSTRUCTION_PROJECT_TRANSITIONS`, terminal-status helper,
  `canTransitionConstructionProject` / `assertConstructionProjectTransition` (throwing
  `ConstructionProjectTransitionError` with code `INVALID_DOCKYARD_PROJECT_TRANSITION`), and
  `transitionConstructionProject` (same-status is a no-op).
- `ConstructionProject.status` now uses that type; the funding (`constructionFunding.ts`,
  `economyPhases.ts`) and completion (`constructionPhase.ts`) write sites go through
  `transitionConstructionProject`. No new commands.
- `CURRENT_COMPATIBILITY_VERSION` bumped `1.1.0 → 1.2.0`; a pre-change save is **rejected** with
  `PERSISTENCE_COMPATIBILITY_MISMATCH` (no released save, so no migration engine — ADR-0129 /
  ADR-0113 §5).
- ADR-0129 records the model, the table and the rejection; registered in `docs/adr/README.md`.

Commands: `vp test run` in `@bluewave/campaign` (7 new), `@bluewave/phase-engine` (315 passed),
`@bluewave/persistence` (69 passed, incl. the `1.1.0` rejection case); `tsc --noEmit` clean.
