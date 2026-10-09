# ADR-0078: REBUILD projects (retained-hull validation, availability, slicing)

## Status

Accepted 2026-10-09. Implements ticket 28 on top of ADR-0070 (`ReviseProject` refuses a change past the redesign window with `REVISION_REQUIRES_REBUILD`) and ADR-0077 (construction progress per work package). Slice 28a delivered.

## Context

A change to a ship that is launched, or built past the redesign window, cannot be a revision: DESIGN-23 sections 17-23 say it becomes a rebuild of a completed ship. Today the player is told to finish the ship and order the new design as a new class.

## Decisions

1. **The rebuild limits are the rule's own, not tuned.** `rebuild_validation_v1` (DESIGN-23 section 21): displacement +20 %, designed speed +3 kn, hull length and beam +/-5 %, and no change of hull form. They live in `balance.yaml` under `rebuild:` as `maxDisplacementIncreaseBp 2000`, `maxSpeedIncreaseMilliKnots 3000`, `maxLengthChangeBp 500`, `maxBeamChangeBp 500`. Every limit is inclusive and exact (integer arithmetic).
2. **A pure validator first.** `validateRebuild(source, target, balance, dock?)` returns a report with BLOCKING, well-formed findings in a fixed order (`REBUILD_HULL_FORM_CHANGED`, `_DISPLACEMENT_LIMIT`, `_SPEED_LIMIT`, `_LENGTH_LIMIT`, `_BEAM_LIMIT`, `_NO_DOCK`) and signed measures. A design that is legal as new construction can be rebuild-illegal; a failed rebuild changes nothing.
3. **What the validator does not decide.** Technology, treaty, classification, stability and topside load are the compile's own findings and are checked by the command through `compileDesign`, as `ReviseProject` does. Damage, defects and service life have no engine state yet and are recorded as deferred, not guessed. The "pressure-hull / flight-deck conversion needs a conversion technology" clause is covered by refusing every hull-form change until such a technology exists.
4. **Rebuild work and cost are PLACEHOLDER balance, labelled as such.** DESIGN-23 section 21 lists "cost and remaining service-life policy" without numbers; when slice 28c needs them they are added to `balance.yaml` marked PLACEHOLDER/ESTIMATE like every other unsourced constant.

## Slices

- **28a (done):** the validator, the balance, the content plumbing (`ShipBuildingContent.rebuild`), tests at every boundary.
- **28b:** engine state: `ConstructionProject.projectType` gains `REBUILD` with `targetShipId`; ship availability (`UNAVAILABLE` for the whole project, DESIGN-23 section 20) enforced where ships move, train and enter battle generation.
- **28c:** a `StartRebuild` command, its lifecycle checks and the rebuild plan (work packages, PLACEHOLDER cost); settlement on cancellation (section 23).
- **28d:** completion creates exactly one new design version and a ship transition record; the old version is kept (section 22).
- **28e:** the desktop bridge and the Drawing Board entry point ("Rebuild this ship") with the validator's report.

## Consequences

Each slice is shippable. Slices b and c change engine state and the command set, so they carry the determinism and golden checks; 28a changes only content and a pure function.
