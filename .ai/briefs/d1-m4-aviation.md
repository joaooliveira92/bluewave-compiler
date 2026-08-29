# Milestone D-1 — M4 Aviation: Aircraft Development, Squadrons, and Basing (scoping + implementation)

## Objective

Land a milestone brief + implementation spec for **D-1**: the DESIGN-43 (`docs/rules/aircraft.md`) **aircraft development pipeline, squadron lifecycle, and basing system** slice of M4 Aviation — a deterministic, pure, phase-stage-resolving aircraft development module under `@bluewave/combat/src/aircraft/`, wired into the campaign phase pipeline at order 7.2 (`resolve_aircraft_development`, rngAllowed) — run through the normal orchestrator pipeline (spec → slice → implement → review → gate).

## Canonical requirements

- DESIGN-43 (`docs/rules/aircraft.md`) — **§§1-21, §§32-41** (aircraft types, model definitions, development pipeline, proposals, private ventures, inventory states, squadron lifecycle, auto-equip, re-equipment, expansion, basing capacity, damaged dispositions, basing classes, inventory allocation, records, ordering, reason codes, validation).
- DESIGN-38 (`docs/rules/tactical-combat.md`) — records/ordering pattern (`BattleLedger` + `canonicalEventOrder`), reason-code catalog.
- DESIGN-07 — fixed-point authoritative arithmetic.
- DESIGN-55 §5 — M4 depends on accepted M1+M2+M3.
- ENGINEERING-CONTRACT binding. Golden hashes regenerate (new phase stage, ADR-0007 process). `BattleResolver`/`StrengthCalculator` unmodified.

## Starting state

C-6 (M3 acceptance gate) DONE (2026-08-29, PASS). `@bluewave/combat` has mature module patterns at `packages/combat/src/<module>/` (smoke, torpedoes, submarines, mines, coastal-defense). 14-phase pipeline in `@bluewave/phase-engine`. Aircraft research note grounded: `docs/research/d1-m4-aviation-performance-baseline.md`.

## Scope summary

| Area | Scope decision |
|------|----------------|
| Aircraft model + type definitions | IN (DESIGN-43 §§1-2) |
| Aircraft state model (NationState.aircraft) | IN (§3) |
| Development pipeline (request, proposal, project) | IN (§§4-10) |
| Private ventures | IN (§§11-12) |
| Squadron lifecycle + auto-equip + re-equipment + expansion | IN (§§13-19, §35) |
| Basing model + damaged disposition | IN (§§20-21, §32) |
| Records, ordering, reason codes | IN (§§38-41) |
| Mission-role feasibility engine | DEFERRED to D-2 (§§22-31) |
| Experience/fatigue binding | DEFERRED (DESIGN-28 unassigned, §36) |
| Aircraft production pipeline | DEFERRED (§37) |
| Tactical battle engagement | DEFERRED (D-2/D-3) |
| Content YAML constants | DEFERRED (CONTENT-track) |

## Key decisions

- **Aircraft state**: `NationState.aircraft` — flat counts per model+condition, `AircraftNationState` type.
- **Phase stage**: `resolve_aircraft_development` at order 7.2 (after `resolve_research` 7, before `battle_generation` 7.5), `rngAllowed: true`.
- **Constants shipped**: `aircraft_development_duration_v1`, `aircraft_role_baselines_v1`, `aircraft_trait_weights_v1`, `aircraft_basing_capacities_v1`.
- **Score grounding**: Research-grounded 0-100 scores for early aircraft (Wright Flyer speed ~7, SPAD S.XIII ~72).
- **Reason codes**: 15 of 21 §40 codes shipped; 6 deferred behind `AIRCRAFT_MISSION_ROLE_DEFERRED` marker.

## Acceptance criteria

28 ACs mapped to requirement IDs + proving tests (see spec §1.1 for full table). Headline: model definition, state invariants, development pipeline, private ventures, squadron lifecycle, auto-equip, re-equipment, expansion, basing, damaged disposition, inventory allocation, records/ordering, reason-code set-equality, phase wiring, contracts rollup, two-process determinism.

## Implementation increments

| INC | Deliverable |
|-----|-------------|
| INC-1 | Aircraft model + type definitions |
| INC-2 | Aircraft state model |
| INC-3 | Development pipeline (request→proposal→project→acceptance) |
| INC-4 | Private ventures |
| INC-5 | Squadron lifecycle + auto-equip + re-equipment + expansion + allocation |
| INC-6 | Basing model + damaged disposition |
| INC-7 | Phase stage + engine wiring |
| INC-8 | Reason codes rollup + set-equality guard |
| INC-9 | Contracts rollup + ADR + traceability + gate |

## Dependencies

- M1+M2+M3 ACCEPTED (satisfied at C-6 gate).
- No blocking dependency on D-2/D-3/D-4 — aviation state model and development pipeline are independent of carrier ops/AA.
- `@bluewave/random` for keyed RNG streams (already available).
- `@bluewave/commands` for request/accept/purchase commands (already available).

## Deferred to later sprints

- **Content YAML** for real aircraft models (CONTENT-track, post M4/parallel).
- **Mission-role resolution** in tactical combat (D-2 or later).
- **Player UI** for aircraft development/squadron management (desktop-track).

## Deliverable

A valid spec at `.scratch/d1-m4-aviation/spec.md` with 9 frontier-ordered implementation tickets (INC-1..INC-9), ready for the implementator + reviewer + orchestrator gate pipeline.