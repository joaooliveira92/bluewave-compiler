# ADR-0097: First-release combat surface — defer the unreachable M3/M4 modules

## Status

Superseded by: ADR-0112 (2026-10-11).

## Context

`docs/architecture/module-reachability.md` (derived from the phase registry, month
pipeline, and tactical minute pipeline) shows five modules that are built and
unit-tested but not reachable from a compiled campaign:

- **Smoke** (C-5 / DESIGN-42), **air combat** (D-3 / DESIGN-43/44) and **air defense**
  (D-4 / DESIGN-45) tactical stages exist in `advanceMinute`, but `resolveBattleAuto`
  never supplies their contexts, so those stages no-op in a campaign battle.
- **Mine warfare** (C-2 / DESIGN-35), **submarines** (C-3 / DESIGN-34) and **coastal
  defense** (C-4 / DESIGN-48) are not referenced by `phase-engine` at all — no strategic
  phase runs them.

Wiring them is not free: supplying a smoke context alone changes every affected battle's
per-minute hashes (a golden re-pin and a balance re-review), and mine/submarine/coastal
need new strategic phases. The design docs for these subsystems remain normative; absence
from the release is a scope statement, not a contradiction of the design.

## Decision

1. **The first release's reachable combat surface is the current set**: at the strategic
   level the wired month phases; inside a battle contact/movement/weather/gunnery/damage/
   fire/flooding/damage-control/torpedoes.
2. **The five unreachable modules are deferred, named, for the first release.** They are
   tracked in `.scratch/playable-loop/issues/03-wire-m3-m4-battle-modules.md`; each is
   either wired later or stays deferred with its DESIGN doc marked future.
3. **Nothing is silently dropped.** This ADR plus the reachability table are the record;
   the release scope (`docs/delivery/release-scope-and-implementation-order.md`) and
   `docs/PROGRESS.md` reference them.
4. **Smoke and air are the cheapest to wire** (contexts, not phases) and are the first
   candidates when the deferral is lifted; they are still out of the first release because
   wiring smoke re-pins battle goldens and 1880 has no carrier/air combatant.

## Alternatives considered

- **Wire smoke now.** Rejected for the first release: it changes authoritative per-minute
  hashes across the combat suite and needs a balance re-review, for a feature (smoke
  screens) not required by the 1880 slice.
- **Wire mine/submarine/coastal phases now.** Rejected: real M3 scope, not loop-wiring.
- **Say nothing.** Rejected: unreachable-but-"done" modules are exactly the illusion the
  reachability table exists to break.

## Consequences

- The release scope is honest and testable; reviewers can point at the table.
- Unlocking a deferred module is a bounded, tracked change, not archaeology.
- `docs/architecture/module-reachability.md` is the single source for reachability.
