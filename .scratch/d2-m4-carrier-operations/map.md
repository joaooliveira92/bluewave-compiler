# D-2 (M4 Aviation: Carrier Operations) — Wayfinder Map

## Destination

A full vertical slice of DESIGN-44 (Carrier Operations, 629 lines): the **carrier state model, capacity/spot/jet/deck/strike/maneuver/wind/hazards/night/weather/ordnance/damage** subsystem implemented as pure deterministic functions in `@bluewave/combat/src/carrier-operations/` with `*_v1` contracts, reason codes, records/ordering, and two-process determinism — wired into the campaign pipeline as a new phase stage (`resolve_carrier_operations`, order TBD). Carrier air-group lifecycle and aircraft model compatibility depend on D-1's aircraft model definitions and basing classes. No tactical CAP/strike mission integration (D-3), no air defense (D-4).

## Notes

- **Domain:** DESIGN-44 (`docs/rules/carrier-operations.md`). Full 629-line spec, 33 §32 acceptance criteria.
- **Dependencies:** D-1 (aircraft model definitions, basing classes, squadron lifecycle) — must be ACCEPTED before D-2 implementation. Currently D-1 is COMPLETE (2026-08-29).
- **Boundary with D-3:** D-2 owns the carrier **operations engine** (capacity, spot, deck cycles, launch/recovery, hazards, etc.). D-3 owns **CAP & strike missions** (using D-1 squadrons aboard D-2 carriers to conduct tactical missions). D-2 provides the carrier state and operations primitives; D-3 orchestrates missions.
- **Phase wiring:** New phase stage `resolve_carrier_operations` at order TBD (likely after `resolve_aircraft_development` 7.2, before `battle_generation` 7.5). Goldens regenerate under ADR-0007.
- **`BattleResolver`/`StrengthCalculator`:** unmodified (integration-boundary test required).
- **Existing patterns:** follow C-track/D-1 convention (`packages/combat/src/carrier-operations/`, `*_v1` contracts, reason codes, integration-boundary test, two-process determinism child).
- **Key skills:** research, to-spec, to-tickets.
- **Constants:** shipped constants per DESIGN-44 §3 (capacity scale), §5 (oversized multipliers), §7 (spot modifiers), §14 (prep times), §15 (time modifiers), §16 (coordination), §18 (launch rates), §22 (hazard probabilities), §24 (loss probabilities), §25 (weather suspension). No YAML constants this sprint.

## Decisions so far

| Ticket | Type | Status | Decision |
|--------|------|--------|----------|
| [01-research-carrier-operations-parameters](issues/01-research-carrier-operations-parameters.md) | research | **RESOLVED** | `docs/research/d2-m4-carrier-operations.md` — 27,300 words across 8 topics. All DESIGN-44 constants historically supportable. |
| [02-task-scope-boundary](issues/02-task-scope-boundary.md) | task | **RESOLVED** | Full DESIGN-44 §§1-31 in scope. D-2 = carrier operations engine. D-3 = CAP/strike missions. `resolve_carrier_operations` at order 7.3. State at `NationState.carrierOperations`. |
| [03-task-state-model-design](issues/03-task-state-model-design.md) | task | **RESOLVED** | `Record<ShipId, CarrierOperationsState>` under `NationState.carrierOperations`. 5 invariants. 15 `*_v1` contracts. |
| [04-task-engine-wiring](issues/04-task-engine-wiring.md) | task | **RESOLVED** | Phase order 7.3 confirmed. Strategic-month only, no tactical minute-advance. Integration-boundary test for zero carriers = strict no-op. |
| [05-task-reason-codes-surface](issues/05-task-reason-codes-surface.md) | task | **RESOLVED** | All 21 §31 codes shipped. No deferred markers. Set-equality guard per C/D pattern. |
| [06-task-contracts-rollup](issues/06-task-contracts-rollup.md) | task | **RESOLVED** | 15 contracts confirmed. Follow D-1 pattern for `SHIPPED_CARRIER_OPERATIONS_CONTRACT`. |

## Not yet specified

- Carrier operations and aircraft inventory interaction (how D-1's `AircraftNationState` supplies aircraft to D-2 carriers) — depends on D-1's exact state model shape.
- Phase stage order — likely between `resolve_aircraft_development` (7.2) and `battle_generation` (7.5), but may need to sit before `resolve_research` if carrier-ops-specific research unlocks carrier capabilities.
- Integration with D-3 CAP/strikes — D-2 produces carrier operations records that D-3 will consume; the exact seam will be specified when D-3 scoping starts.
- Content YAML constants for carrier design data, carrier-specific technologies, airgroup compositions — CONTENT-track.

## Out of scope

- CAP/strike mission execution in tactical combat (D-3).
- Air defense / AA integration (D-4).
- Player UI for carrier management (desktop-track).
- Carrier-specific research technologies (CONTENT-track or deferred to later M4 pass).
- Content YAML carrier data (carrier designs, catapult types, deck configurations).