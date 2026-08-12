# Milestone B-2 — M2 Tactical Movement, Spotting & Contact State (scoping)

## Objective

Land a milestone brief + implementation spec for **B-2**: the DESIGN-38
(`docs/rules/tactical-combat.md`) movement / spotting / contact-state subset of M2
Surface Tactical Core — a deterministic, pure, minute-advancing tactical simulation
of movement, detection/spotting, and contact knowledge over the B-1
`TacticalBattleState` scaffolding, plus a research-grounded formation/movement
constant set — so B-2-IMPL can run through the normal orchestrator pipeline.

## Canonical requirements

- DESIGN-38 (`docs/rules/tactical-combat.md`) — **movement/spotting subset only**
  (§3 steps 4–8, §8, §19, §20, §35, §36 subset).
- DESIGN-26 (`docs/domain/divisions-and-formations.md`) — formations/stations.
- DESIGN-07 — fixed-point authoritative arithmetic.
- DESIGN-55 §3 — M2 depends on accepted M1 + battle-generation + persistence +
  auto-resolution boundaries.
- ENGINEERING-CONTRACT binding.

## Starting state

B-1 IMPL DONE (PASS_WITH_LIMITATIONS). `@bluewave/combat` has scaffold:
`movement.ts` (MovementState + `assertFixedPointMovement`), `targeting.ts`
(ContactTrack + `validateTargetOrder`), `tactical/{state,unit,division,shipType}.ts`,
`tacticalPipeline.ts` (named-but-empty spot/movement phases),
`tacticalClock.ts`, `tacticalTime.ts`, `fullSpeedStress.ts`, `battleLedger.ts`.
The orchestrator must verify rather than assume these.

## In scope

- Movement kinematics: position advance, propulsion, turning, formation stations
  (INC-1).
- Spotting/sensor detection model + line-of-sight, baseline clear daylight
  (INC-2).
- Contact-track lifecycle (create/update/age/merge) + fog-of-war enforcement
  (INC-3).
- `TacticalClock`-driven minute-advance simulation emitting battle events + hashes
  (INC-4).
- Versioned `*_v1` constants + `SHIPPED_*_CONTRACT` guards + DESIGN-38 §36-subset
  reason codes; research-grounded formation/movement constant set (INC-5).
- ADR-0018 + spec + brief + research note + traceability.

## Out of scope

- Gunnery (B-3), armor/damage (B-4), weather/visibility modifiers (B-5), smoke (M3),
  ECM/radar (M5), collisions/grounding resolution (hook only), phase-pipeline wiring
  replacing `BattleResolver` (B-6), auto-resolution statistical validation, player
  battle UI. No production-pack YAML change; golden hashes unchanged; no campaign
  snapshot schema change.

## Required implementation

Public contracts (pure functions over `TacticalBattleState` + `TacticalClock`):
movement advance, detection resolve, contact update; a minute-advance orchestrator;
versioned constant contracts with validate guards; structurally emitted reason
codes; deterministic (keyed streams only, no ambient randomness/clock). Tests:
unit (movement/spotting/contact incl. invalid/boundary), integration (pipeline
order + events), determinism (two runs byte-identical + cross-process). No phase or
snapshot change; `BattleResolver` unmodified.

## Scoping-sprint deliverable (this sprint)

- wayfinder map `.scratch/b2-m2-movement-spotting/map.md` + decision tickets
  `issues/01..06` (resolved);
- implementation spec `.scratch/b2-m2-movement-spotting/spec.md` (AC-1..15, INC-1..5);
- research note `docs/research/b2-m2-movement-spotting.md`;
- ADR-0018; `.ai/specs/b2-movement-spotting.md` pointer;
- SPRINT-PLAN B-2 row → scoping DONE + pointer to B-2-IMPL; PROGRESS update;
- Conventional Commit(s) on `dev`; clean working tree.

Next sprint: **B-2-IMPL** executes spec INC-1..INC-5 via the pipeline with the
orchestrator validation gate.
