# D-4 Milestone Brief — M4 Aviation: Air Defense / AA

## Objective

Scope and implement AA air-defense systems (HEAVY_AA, MEDIUM_AA, LIGHT_AA, CIWS_TERMINAL_DEFENSE) as a pure deterministic module in `@bluewave/combat/src/air-defense/` — defense system definitions, state model, layer resolution order, eligibility predicates (heavy/medium/light), engagement probability formula (9-factor basis-point), director assignment and scaling, radar-directed medium-AA saturation, CIWS redundancy, disruption severity levels, ammunition consumption, simplified damage/power effects, records, ordering, reason codes (20 shipped), contracts, and engine stage wiring (step 7.8, after air-combat, before spotting).

## Canonical requirements

DESIGN-45 (511 lines, 29 sections) — AA subset only (§§1-2, 6-12, 14-21, 26-29). SAM layers (§§3-5 HEAVY_SAM/MEDIUM_SAM/LIGHT_SAM) deferred to E-track.

## Starting state

D-1 (aircraft models, squadrons, basing), D-2 (carrier operations), D-3 (CAP & strikes) all COMPLETE. M1+M2+M3 completed.

## Scope summary

| Area                                     | Scope decision            |
| ---------------------------------------- | ------------------------- |
| Defense system definitions (§3)          | IN (INC-1)                |
| AirDefenseState (§2)                     | IN (INC-1)                |
| Layer resolution §1 (AA only)            | IN (INC-2)                |
| Heavy AA eligibility (§7)                | IN (INC-2)                |
| Medium AA eligibility + timing (§8)      | IN (INC-2)                |
| Light AA windows + speed bands (§9)      | IN (INC-2)                |
| Guaranteed light-AA disruption (§10)     | IN (INC-5)                |
| Director assignment + scaling (§11-12)   | IN (INC-4)                |
| Radar-directed medium-AA groups (§13-14) | IN (INC-4)                |
| CIWS + redundancy (§15-16)               | IN (INC-4)                |
| Engagement formula (§19)                 | IN (INC-3)                |
| Disruption (§6)                          | IN (INC-3)                |
| Ammunition (§20)                         | IN (INC-3)                |
| Simplified damage/power (§21)            | IN (INC-3)                |
| Records + ordering (§26-27)              | IN (INC-5)                |
| Reason codes (§28)                       | IN (INC-5)                |
| Contracts                                | IN (INC-5)                |
| Engine wiring (step 7.8)                 | IN (INC-6)                |
| SAM (HEAVY/MEDIUM/LIGHT)                 | DEFERRED to E-track (M5)  |
| Content YAML                             | DEFERRED to CONTENT-track |
| Player UI                                | DEFERRED to desktop-track |

## Key decisions

- **Module location**: `packages/combat/src/air-defense/` — parallel to air-combat/
- **Engine stage**: step 7.8, after resolveAirCombat (7.7), before resolveSensorsSpotting (8)
- **Integration**: optional AirDefenseContext in AdvanceMinuteInput, strict no-op when absent
- **SAM deferral**: DESIGN-55 §14 reachability markers for SAM layers
- **Damage model**: simplified (system-level OPERATIONAL/DAMAGED/DESTROYED), not full component-level
- **Ammunition model**: basic (rounds per engagement + magazine capacity), not burst/cooling/reload

## Acceptance criteria

20 ACs (AC-1..AC-20) — see spec §1.2 for full table.

## Implementation increments

6 frontier-ordered tickets (INC-1..INC-6) at `.scratch/d4-m4-air-defense/issues/`.

## Dependencies

- D-3 (CAP & strikes) — provides the attack surface that AA defends against
- D-2 spotting model — provides detection for AA engagement windows
- `@bluewave/random` for keyed RNG streams

## Deferred

SAM systems (E-track), full damage model, full ammunition model, content YAML, player UI, AI AA planning.

## Deliverable

Valid spec + 6 implementation tickets (frontier-ordered, blocks wired), ready for the implementator + reviewer + orchestrator gate pipeline.
