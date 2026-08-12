# Wayfinder Map — B-2 (M2 Tactical Movement, Spotting & Contact State)

Effort slug: `b2-m2-movement-spotting`.

## Destination

A milestone brief + implementation spec for **B-2**: the DESIGN-38
(`docs/rules/tactical-combat.md`) **movement / spotting / contact-state subset**
of M2 Surface Tactical Core. When the map is done, the way to a deterministic,
pure, minute-advancing tactical simulation of movement, detection/spotting, and
contact knowledge over the B-1 `TacticalBattleState` scaffolding is clear enough
for the implementator to run B-2-IMPL through the normal pipeline (spec → slice →
implement → review → gate).

## Notes

- Domain: M2 tactical combat engine mechanics, `@bluewave/combat`. Content
  deliverable is the **formation/movement constant set** (engine versioned
  constants grounded in research); no production pack YAML change expected.
- Governing doc: DESIGN-38 (movement/spotting subset only). Cross-refs: DESIGN-26
  (formations), DESIGN-07 (fixed-point arithmetic), DESIGN-55 §3 (M2 depends on
  accepted M1 + battle-generation + persistence + auto-resolution boundaries).
- Existing scaffold already in `packages/combat/src/`: `movement.ts` (MovementState
  fields + `assertFixedPointMovement`), `targeting.ts` (ContactTrack +
  `validateTargetOrder` fog guard), `tactical/state.ts` (`TacticalBattleState`,
  `BattleContact`), `tacticalPipeline.ts` (named steps incl.
  `update_contact_knowledge`, `resolve_movement_intent`, `resolve_propulsion_formation`,
  `resolve_sensors_spotting` — currently empty records), `tacticalClock.ts`,
  `tacticalTime.ts`, `fullSpeedStress.ts`, `battleLedger.ts`, `battleEvent`.
- Skills every session should consult: to-spec, to-tickets, research (ground
  movement constants); ENGINEERING-CONTRACT determinism/arithmetic rules binding.
- Triage: `.scratch/` local-markdown tracker; map = `map.md`, child tickets =
  `issues/NN-slug.md` (`Type:`/`Status:`/`Blocked by:` front-matter).

## Decisions so far

- **scope-boundary** — B-2 delivers the movement/spotting/contact subset of
  DESIGN-38 as a pure simulation engine in `@bluewave/combat`; gunnery (B-3),
  armor/damage (B-4), weather modifiers (B-5), collisions/grounding, ECM/sensors
  (M5), and phase-pipeline wiring that replaces `BattleResolver` (B-6) are out.
  Baseline clear-daylight visibility only; weather/visibility constants deferred.
- **phase-integration-boundary** — B-2 is engine-only: it adds a deterministic
  minute-advance tactical simulation but does NOT wire it into the `battle_resolution`
  phase or change campaign snapshot schema, so golden hashes stay unchanged and
  `BattleResolver`/`StrengthCalculator` remain untouched (results→campaign
  integration is B-6).
- **movement-kinematics-model** — MovementState kinematics: fixed-position advance
  from heading+currentSpeed, propulsion approaches orderedSpeed via thrust/brake
  acceleration, turning rate-limit heading toward ordered heading, and formation
  station offset computation for LINE_AHEAD/etc. Collisions/grounding resolution
  deferred (empty-record hooks).
- **spotting-sensor-model** — deterministic detection model: per-sensor detection
  range, line-of-sight (flat-sea clear), baseline clear-daylight visibility; random
  detection resolution only through keyed streams. Known threats detected; unknown
  tracks carry uncertainty. Weather/smoke/ECM modifiers deferred.
- **contact-lifecycle** — contact track create/update/age/merge lifecycle feeding
  `TacticalBattleState.contacts`; confidence (basis points) + uncertainty; fog-of-war
  enforced by reusing `validateTargetOrder` (targets reference legal ContactTrack).
- **content-constants** — formation/movement constants are engine versioned
  constants (`*_v1` + `SHIPPED_*_CONTRACT` + validate guard), grounded in
  `docs/research/b2-m2-movement-spotting.md`. No production-pack YAML change this
  sprint.

## Not yet specified

- Exact fixed-point coordinate quanta and per-knot speed/heading scale constants
  (reuse existing `MovementState` int positions; resolve during INC-1 rather than
  over-chart now).
- Whether a single spawn/placement function for initial positions is needed for
  deterministic simulation setup (provision: derive from manifest area geometry;
  carried as a spec INC-4 item and resolved there).
- Contact-aging exact interval + confidence decay slopes (base values from
  research; exact shipped constants during INC-3).

## Out of scope

- **gunnery (B-3)** and **armor/damage (B-4)** and **weather/visibility (B-5)**
  subsets — later M2 sprints; spotting uses baseline clear daylight only.
- **collisions/grounding** resolution (DESIGN-38 §3 step 7) — deferred engineering
  hook; empty records this sprint.
- **phase-pipeline wiring** replacing `BattleResolver` — B-6.
- **smoke (M3), ECM/radar (M5), player battle UI** — later milestones.

## Backlog

Decision tickets 01–06 live in `issues/` (all resolved in this scoping sprint).
The implementation plan they unblock is the B-2 spec + frontier-ordered increments
in `spec.md`; B-2-IMPL executes those increments through the pipeline.
