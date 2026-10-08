# Milestone D-2 — M4 Aviation: Carrier Operations (scoping)

## Objective

Scope and implement DESIGN-44 (Carrier Operations, 629 lines) as a deterministic, pure, phase-stage-resolving carrier operations engine under `@bluewave/combat/src/carrier-operations/`, wired into the campaign pipeline at order 7.3 (`resolve_carrier_operations`, rngAllowed: true) — run through the normal orchestrator pipeline (spec → slice → implement → review → gate).

## Canonical requirements

- DESIGN-44 (`docs/rules/carrier-operations.md`) — full 33-section, 629-line spec covering: carrier state (§1), classification/capacity (§2-3), deterministic assignment (§4), oversized policy (§5), spot value (§6-7), jet capability (§8-10), deck cycles (§11), contention (§12), strikes (§13-18), maneuver (§19), wind-over-deck (§20), hazards (§21-22), night ops (§23-24), weather (§25), recovery (§26), ordnance (§27), deck/hangar damage (§28), records (§29), ordering (§30), reason codes (§31), validation (§32).
- DESIGN-43 — aircraft model definitions and basing classes (D-1) — carrier operations references these by `modelId`/`squadronId`.
- DESIGN-38 — records/ordering pattern.
- DESIGN-07 — fixed-point authoritative arithmetic.
- DESIGN-55 §5 — M4 depends on accepted M1+M2+M3.
- ENGINEERING-CONTRACT binding. Golden hashes regenerate (new phase stage, ADR-0007 process). `BattleResolver`/`StrengthCalculator` unmodified.

## Starting state

D-1 (M4 aircraft development) COMPLETE (2026-08-29, PASS). M1+M2+M3 completed. `@bluewave/combat` has mature module patterns at `packages/combat/src/<module>/` (aircraft, smoke, torpedoes, submarines, mines, coastal-defense). 14-phase pipeline in `@bluewave/phase-engine`. Aircraft research note at `docs/research/d1-m4-aviation-performance-baseline.md`.

## Scope summary

| Area                                                 | Scope decision                  |
| ---------------------------------------------------- | ------------------------------- |
| Carrier state model (§1)                             | IN                              |
| Classification & capacity bounds (§2-3)              | IN                              |
| Deterministic capacity assignment (§4)               | IN                              |
| Oversized air group policy (§5)                      | IN                              |
| Spot value base + modifiers (§6-7)                   | IN                              |
| Jet carrier capability + eligibility (§8-10)         | IN                              |
| Deck-cycle states + transitions (§11)                | IN                              |
| Deck contention policy (§12)                         | IN                              |
| Strike state + preparation (§13-14)                  | IN                              |
| Strike-time modifiers + coordinated effects (§15-16) | IN                              |
| Spot-value launch limit + launch rate (§17-18)       | IN                              |
| Automatic carrier maneuver (§19)                     | IN                              |
| Wind-over-deck requirements (§20)                    | IN                              |
| Deck hazard exposure + fire/explosion (§21-22)       | IN                              |
| Night recovery eligibility + loss risk (§23-24)      | IN                              |
| Weather suspension (§25)                             | IN                              |
| Recovery priority (§26)                              | IN                              |
| Ordnance state (§27)                                 | IN                              |
| Deck/hangar damage effects (§28)                     | IN                              |
| Records, ordering, reason codes (§29-31)             | IN                              |
| CAP/strike mission execution in tactical combat      | DEFERRED to D-3                 |
| Air defense / AA integration                         | DEFERRED to D-4                 |
| Experience/fatigue binding                           | DEFERRED (DESIGN-28 unassigned) |
| Content YAML constants                               | DEFERRED (CONTENT-track)        |

## Key decisions

- **State location**: `NationState.carrierOperations` — `Record<ShipId, CarrierOperationsState>`.
- **Phase stage**: `resolve_carrier_operations` at order 7.3 (after `resolve_aircraft_development` 7.2, before `battle_generation` 7.5), `rngAllowed: true`.
- **Constants shipped**: 15 `*_v1` contracts for state, assignment, spot, jet, deck, contention, strike, launch, wind, hazard, night, weather, recovery, ordnance, oversized.
- **Reason codes**: All 21 DESIGN-44 §31 codes shipped; no deferred markers.
- **Tactical integration**: minimal — strategic-level carrier ops only. Minute-advance tactical integration deferred to D-3.
- **Goldens**: regenerate when `resolve_carrier_operations` wires in (ADR-0007).

## Acceptance criteria

37 ACs mapped to requirement IDs + proving tests (see spec §1.1 for full table). Headline: state model, classification, capacity, spot, jet, deck cycles, contention, strikes, maneuver, wind, hazards, night, weather, recovery, ordnance, damage, records, ordering, reason codes, phase wiring, contracts, two-process determinism.

## Implementation increments

| INC   | Deliverable                                                 |
| ----- | ----------------------------------------------------------- |
| INC-1 | Carrier state model + classification + capacity (§§1-5)     |
| INC-2 | Spot value + modifiers + jet eligibility (§§6-10)           |
| INC-3 | Deck-cycle states + contention (§§11-12)                    |
| INC-4 | Strike preparation + launch + recovery (§§13-18)            |
| INC-5 | Carrier maneuver + wind-over-deck (§§19-20)                 |
| INC-6 | Hazards + night ops + weather suspension (§§21-25)          |
| INC-7 | Recovery priority + ordnance + deck/hangar damage (§§26-28) |
| INC-8 | Records + ordering + reason codes (§§29-31)                 |
| INC-9 | Engine wiring + contracts rollup + two-process + gate       |

## Dependencies

- M1+M2+M3 ACCEPTED (satisfied at C-6 gate).
- D-1 (aircraft model definitions, basing classes, squadron lifecycle) — ACCEPTED (D-1 gate 2026-08-29).
- No blocking dependency on D-3/D-4 — carrier operations engine is independent of CAP/strike missions and AA.
- `@bluewave/random` for keyed RNG streams (already available).
- `@bluewave/commands` if any carrier-specific commands needed (likely deferred to D-3).

## Deferred to later sprints

- **CAP/strike mission execution** in tactical combat (D-3).
- **Air defense / AA integration** (D-4).
- **Content YAML** for carrier design data (CONTENT-track).
- **Player UI** for carrier management (desktop-track).
- **Tactical battle integration** of carrier aircraft (D-3).

## Deliverable

A valid spec at `.scratch/d2-m4-carrier-operations/spec.md` with 9 frontier-ordered implementation tickets (INC-1..INC-9), ready for the implementator + reviewer + orchestrator gate pipeline.
