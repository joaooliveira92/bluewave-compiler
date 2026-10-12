# INC-2 — Project status model + save migration

**State:** READY_FOR_AGENT · **Frontier:** yes · **Blocked by:** none
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R7) · **ADR:** project-status model + save migration (new)

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
