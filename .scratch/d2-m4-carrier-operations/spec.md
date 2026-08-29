# D-2 Spec — M4 Aviation: Carrier Operations

- **Sprint:** D-2 (`.ai/SPRINT-PLAN.md` Track D row 2)
- **Kind:** implementation (this spec is the output of the D-2 scoping sprint; D-2-IMPL executes it)
- **Governing docs:** DESIGN-44 (`docs/rules/carrier-operations.md`) — full 33-section, 629-line spec covering carrier state, classification, capacity, spot value, jet capability, deck cycles, contention, strikes, launch/recovery, maneuver, wind-over-deck, hazards, night ops, weather suspension, ordnance, deck/hangar damage, records, ordering, reason codes, validation.
- **Cross-references:** DESIGN-43 (aircraft model definitions, basing classes — D-1), DESIGN-38 (records/ordering), DESIGN-07 (integer arithmetic), DESIGN-55 §5 (M4 depends on accepted M1+M2+M3).
- **Baseline:** D-1 COMPLETE (2026-08-29, PASS). M1+M2+M3 completed. `@bluewave/combat` has mature module patterns at `packages/combat/src/<module>/`. `BattleResolver`/`StrengthCalculator` unmodified. 14-phase pipeline in `@bluewave/phase-engine`.
- **Target:** Carrier operations as pure deterministic functions in `@bluewave/combat/src/carrier-operations/`, plus a new `resolve_carrier_operations` phase stage (order 7.3, rngAllowed: true). No tactical CAP/strike integration (D-3), no air defense (D-4).
- **Delivery contract:** ENGINEERING-CONTRACT.md binding. Goldens regenerate when the new phase stage wires in (ADR-0007 process). `BattleResolver`/`StrengthCalculator` unmodified.

---

## 1. Scope

D-2 delivers a deterministic, pure **carrier operations engine** as a `carrier-operations/` module under `@bluewave/combat`, plus a new `resolve_carrier_operations` phase stage (order 7.3, after `resolve_aircraft_development` 7.2 and before `battle_generation` 7.5) in the monthly pipeline. Carrier operations state lives under `NationState.carrierOperations` — a new field keyed by ship ID. No tactical CAP/strike integration (D-3), no air defence (D-4).

### 1.1 Acceptance criteria (mapped to requirement IDs + tests)

| AC | Requirement (DESIGN-44 + contract) | Proving test |
|----|-------------------------------------|--------------|
| AC-1 | **Complete carrier state** — every carrier has `CarrierOperationsState` with all §1 fields; missing data fails with `INVALID_CARRIER_OPERATIONS_STATE`. (§1) | `carrier-operations/state.test.ts` |
| AC-2 | **Classification capacity bounds** — CVL 4-34, CV 35+; capacity below 4 does not qualify. Capacity 34=CVL, 35=CV. Uses compiled physical capacity, not temporary values. (§2) | `carrier-operations/classification.test.ts` |
| AC-3 | **Capacity units scale** — 2 units per ordinary aircraft slot; piston=2, light jet=3, heavy jet=3, helicopter=2; `physicalCapacity = compiledAircraftCapacity * 2`. (§3) | `carrier-operations/capacity.test.ts` |
| AC-4 | **Integer capacity check** — capacity checked per aircraft using integer units without aggregate fractional rounding; `occupied + assigned <= physicalCapacity`. (§3-4) | `carrier-operations/capacity-check.test.ts` |
| AC-5 | **Deterministic capacity assignment** — assignment order: CAP → permanent → returning → strike → search → replacement → ferry → ascending ids. Capacity failure = `CARRIER_CAPACITY_EXCEEDED`, no partial assignment. (§4) | `carrier-operations/assignment-order.test.ts` |
| AC-6 | **Oversized carrier policy** — compiled capacity >100 triggers 9000bp efficiency, 12500bp maintenance, 9500bp coordination, 11000bp hazard multipliers. Exactly 100 = no penalty. (§5) | `carrier-operations/oversized.test.ts` |
| AC-7 | **Base spot value** — `floor(compiledAircraftCapacity / 2)`. Capacity 4 = spot 2, capacity 35 = spot 17. (§6) | `carrier-operations/spot-value.test.ts` |
| AC-8 | **Spot modifiers — catapult, speed, deck, damage, tech, oversized** — final spot = `floor(baseSpot * catapultBp * speedBp * deckBp * damageBp * techBp * oversizedBp / 10_000^6)`, clamped 0..capacity. Once-round with FLOOR. All multiplier values per §7. (§7) | `carrier-operations/spot-modifiers.test.ts` |
| AC-9 | **Speed-spot interaction** — below 20kt = 6000bp, 20-24kt = 8000bp, 24-28kt = 10000bp, 28+kt = 11000bp. Exactly 24kt = 10000bp (no reduction). (§7.2) | `carrier-operations/speed-spot.test.ts` |
| AC-10 | **Jet carrier capability** — each carrier declares NONE/LIGHT_JET_CAPABLE/HEAVY_JET_CAPABLE/MODERN_JET_CAPABLE. Requires all physical/technology/doctrine predicates. (§8) | `carrier-operations/jet-capability.test.ts` |
| AC-11 | **Light-jet eligibility** — ≥40,000t or ≥30,000t+catapult + tech + physical predicates. Displacement alone insufficient. Aircraft must have `carrierSuitable: true` + weather/wind. (§9) | `carrier-operations/light-jet.test.ts` |
| AC-12 | **Heavy-jet eligibility** — ≥40,000t + modern_jet_carrier_operations + catapult + arresting gear + angled deck + strength/heat + aircraft limits. Angled deck mandatory. (§10) | `carrier-operations/heavy-jet.test.ts` |
| AC-13 | **Explicit deck-cycle states** — 13 states per §11. Each transition explicit, timestamped, validated. Invalid transitions = `INVALID_CARRIER_DECK_CYCLE_TRANSITION`. (§11) | `carrier-operations/deck-cycles.test.ts` |
| AC-14 | **Deck contention policy** — straight deck: 1 operation class at a time. Angled deck: launch/spotting + recovery overlap when damage/weather/traffic permit. Emergency recovery preempts. Priority per §12. (§12) | `carrier-operations/deck-contention.test.ts` |
| AC-15 | **Strike state** — every strike has `CarrierStrikeState` with all §13 fields. Targeting uses legal knowledge/reports, not hidden true state. (§13) | `carrier-operations/strike-state.test.ts` |
| AC-16 | **Strike preparation times** — ordinary uncoordinated: 20min. Coordinated: 30min. Alert CAP: 5min. Search: 10min. Emergency re-strike: 10min. (§14) | `carrier-operations/strike-prep.test.ts` |
| AC-17 | **Strike-time modifiers** — final = `clamp(5, 90, ceil(basePrep * crewBp * catapultBp * deckBp * damageBp * weatherBp * oversizedBp / 10_000^6))`. Values per §15. Only explicit modifiers included. (§15) | `carrier-operations/strike-time-modifiers.test.ts` |
| AC-18 | **Coordinated strike effects** — coordinated: 12000bp cohesion/defense, 8500bp dispersion, 9000bp loss, 10min formation. Uncoordinated: 10000bp neutral, 5min formation. Coordination never improves penetration/damage. (§16) | `carrier-operations/coordinated-strike.test.ts` |
| AC-19 | **Spot-value launch limit** — launch cycle aircraft ≤ final spot value. Equality legal. Larger = split cycles or `CARRIER_STRIKE_EXCEEDS_SPOT_VALUE`. Multiple cycles preserve squadron/escort/fuel/timing records. (§17) | `carrier-operations/spot-launch-limit.test.ts` |
| AC-20 | **Launch rate** — no catapult piston: 2/min. 1 catapult: 3/min. 2+ catapults: 4/min. Steam+ light jets: 2/min. 2+ steam: 3/min. Heavy jets: 2/min. `ceil(aircraftCount / rate)`. (§18) | `carrier-operations/launch-rate.test.ts` |
| AC-21 | **Automatic carrier maneuver** — controller creates authoritative maneuver command during launch/recovery. Conflicting orders → `CARRIER_MANEUVER_LOCKED_BY_DECK_OPERATION`. (§19) | `carrier-operations/carrier-maneuver.test.ts` |
| AC-22 | **Wind-over-deck requirements** — piston launch: 20kt, recovery: 18kt. Light jet launch: 25kt, recovery: 22kt. Heavy jet launch: 30kt, recovery: 25kt. Helo: model-defined, default 0. Operation delayed/suspended if unmet. (§20) | `carrier-operations/wind-over-deck.test.ts` |
| AC-23 | **Fueled/armed deck hazard** — integer exposure weights per §21. Hazard checks only after eligible hit/fire spread/crash/fuel leak/ordnance accident. (§21) | `carrier-operations/hazard-exposure.test.ts` |
| AC-24 | **Aviation fire/explosion probabilities** — base conditional probabilities per §22. Final = `clamp(0, 10000, floor(baseBp * exposureBp * damageBp * firefightingBp * deckConfigBp / 10_000^4))`. Each reaction creates separate causal damage package under DESIGN-41. (§22) | `carrier-operations/fire-explosion.test.ts` |
| AC-25 | **Night recovery eligibility** — requires night_carrier_operations tech + deck lighting + valid contact + wind + weather + command acceptance + fuel. Without tech: emergency recovery only. (§23) | `carrier-operations/night-recovery.test.ts` |
| AC-26 | **Night recovery loss risk** — daylight: 250bp. Twilight: 750bp. Trained night: 2500bp. Emergency: 7500bp. Each failure produces exactly one result (bolter/deck accident/lost overboard/collision/severe crash/pilot+aircraft loss). (§24) | `carrier-operations/night-loss.test.ts` |
| AC-27 | **Weather suspension** — sea state 8-9: all fixed-wing suspended. State 7: heavy jets suspended, others 5000bp rate. Wind outside limits: affected suspended. Heavy precip: jet 5000bp, piston 7500bp. Extreme precip: all launch suspended. Vis <2nm: visual recovery suspended. Deck fire intensity ≥5000: launch/recovery suspended. Suspended ops preserve reservations, emit `CARRIER_OPERATIONS_SUSPENDED_BY_WEATHER`. (§25) | `carrier-operations/weather-suspension.test.ts` |
| AC-28 | **Recovery priority** — emergency fuel → damaged → hazardous ordnance → immediate CAP → returning strike → search → normal CAP → ascending aircraft identifier. Carrier reserves deck/capacity before recovery. (§26) | `carrier-operations/recovery-priority.test.ts` |
| AC-29 | **Ordnance state** — ordnance reserved and tracked by inventory type/quantity. Unused from stood-down strike returns to storage only when all §27 predicates hold. Jettisoned ordnance permanently removed. (§27) | `carrier-operations/ordnance.test.ts` |
| AC-30 | **Deck/hangar damage effects** — damage independently affects: spot value, launch rate, recovery rate, hangar↔deck movement, refueling/rearming, fire/explosion risk, capacity access, repair, jet compatibility. Damaged lift traps aircraft (consume capacity, unavailable). (§28) | `carrier-operations/damage-effects.test.ts` |
| AC-31 | **Carrier operation records** — every assignment, spot calc, deck transition, prep, launch, formation, recovery, diversion, weather suspension, maneuver lock, hazard check, crash, ordnance transaction creates immutable `CarrierOperationRecord` with all §29 fields, including formula/content/ruleset/RNG versions + record hash. (§29) | `carrier-operations/records.test.ts` |
| AC-32 | **Canonical ordering** — ordering per §30: carriers by identifier, emergency first, class priority per §12, strikes by launch time+id, squadrons by id, aircraft by model+id, equipment by id, hazard checks by event+aircraft, inventory by item+transaction id. No DB/UI/locale/clock order. (§30) | `carrier-operations/ordering.test.ts` |
| AC-33 | **Reason-code set-equality** — D-2 ships all 21 §31 codes. No deferred markers (all codes reachable in scope). Set-equality guard prevents silent additions. (§31) | `carrier-operations/reason-codes-rollup.test.ts` |
| AC-34 | **Phase wiring** — new `resolve_carrier_operations` phase (order 7.3, rngAllowed: true) executes `resolveCarrierOperations` per nation. Strict no-op when no carrier-capable ships. Goldens regenerate under ADR-0007. | `campaign-engine/phase-wiring.test.ts` + orchestrator gate |
| AC-35 | **Contracts + validate guards** — every new carrier constant ships `*_v1` + validate guard. See §1.7 for contract list. Contracts fail-closed. | `carrier-operations/contracts.test.ts` |
| AC-36 | **Two-process determinism** — identical state+inputs produce identical hashes and records. Verified by two child processes (byte-compared). | `cross-process-test/run-carrier-operations-child` |
| AC-37 | **`BattleResolver`/`StrengthCalculator` unmodified** — verified by diff; integration-boundary test proves zero wiring. | orchestrator gate |

### 1.2 In scope

1. **Carrier state model + classification + capacity** (INC-1): `CarrierOperationsState` per §1, classification bounds (§2), capacity units + scale (§3), deterministic assignment order (§4), oversized policy (§5). 15 `*_v1` contracts seeded.
2. **Spot value + jet capability** (INC-2): base spot = floor(capacity/2) (§6), spot modifiers (§7), jet capability enum (§8), light/heavy jet eligibility (§9-10).
3. **Deck-cycle states + contention** (INC-3): 13 deck-cycle states with validated transitions (§11), contention policy + priority (§12), `INVALID_CARRIER_DECK_CYCLE_TRANSITION`.
4. **Strike preparation + launch/recovery** (INC-4): strike state (§13), prep times (§14-15), coordinated strike effects (§16), spot-value launch limit (§17), launch rate (§18).
5. **Carrier maneuver + wind-over-deck** (INC-5): automatic maneuver controller (§19), wind-over-deck thresholds (§20).
6. **Hazards + night ops + weather suspension** (INC-6): hazard exposure weights (§21), conditional probabilities (§22), night recovery eligibility + loss risk (§23-24), weather suspension (§25).
7. **Recovery priority + ordnance + deck/hangar damage** (INC-7): recovery order (§26), ordnance tracking (§27), damage effects on carrier ops (§28).
8. **Records + ordering + reason codes** (INC-8): immutable `CarrierOperationRecord` (§29), canonical ordering (§30), all 21 §31 reason codes + set-equality guard.
9. **Engine wiring + contracts rollup + gate** (INC-9): `resolve_carrier_operations` phase (order 7.3), integration-boundary test, contracts rollup, ADR, two-process determinism, orchestrator gate.

### 1.3 Out of scope (deferred)

- **CAP/strike mission execution** in tactical combat (D-3).
- **Air defense / AA integration** (D-4).
- **Tactical engagement of carrier aircraft** with enemy ships/aircraft (D-3/D-4).
- **Experience/fatigue binding** (DESIGN-28, unassigned).
- **Aircraft production pipeline** (DESIGN-43 §37).
- **Content YAML constants** for carrier designs, jet technologies, catapult types (CONTENT-track).
- **Player UI** for carrier management (desktop-track).

### 1.4 Reason-code ship map

All 21 DESIGN-44 §31 codes are shipped in D-2 (all are reachable within scope):

`INVALID_CARRIER_OPERATIONS_STATE`, `CARRIER_CAPACITY_EXCEEDED`, `CARRIER_AIRCRAFT_CAPACITY_INCOMPATIBLE`, `CARRIER_OVERSIZED_AIR_GROUP_PENALTY_ACTIVE`, `CARRIER_SPOT_VALUE_ZERO`, `CARRIER_STRIKE_EXCEEDS_SPOT_VALUE`, `JET_CARRIER_DISPLACEMENT_INSUFFICIENT`, `JET_CARRIER_CATAPULT_REQUIRED`, `HEAVY_JET_CARRIER_INELIGIBLE`, `HEAVY_JET_ANGLED_DECK_REQUIRED`, `INVALID_CARRIER_DECK_CYCLE_TRANSITION`, `CARRIER_DECK_CONTENTION`, `CARRIER_MANEUVER_LOCKED_BY_DECK_OPERATION`, `CARRIER_WIND_OVER_DECK_INSUFFICIENT`, `CARRIER_OPERATIONS_SUSPENDED_BY_WEATHER`, `CARRIER_NIGHT_RECOVERY_INELIGIBLE`, `CARRIER_RECOVERY_OPERATIONAL_LOSS`, `CARRIER_AVIATION_FIRE_HAZARD`, `CARRIER_AVIATION_ORDNANCE_HAZARD`, `CARRIER_ORDNANCE_INVENTORY_INSUFFICIENT`, `CARRIER_OPERATIONS_INVARIANT_FAILED`.

No deferred markers.

### 1.5 Phase registry update

New phase entry (confirmed during ticket 04 resolution):

| Order | Phase | RNG allowed | Notes |
|-------|-------|-------------|-------|
| 7.3 | `resolve_carrier_operations` | yes | Carrier ops advancement per nation; no-op when no carrier-capable ships |

### 1.6 Implementation increments

| INC | Deliverable | ACs | Blocked by |
|-----|-------------|-----|------------|
| INC-1 | Carrier state model + classification + capacity (§§1-5) | AC-1..AC-6 | none |
| INC-2 | Spot value + modifiers + jet eligibility (§§6-10) | AC-7..AC-12 | INC-1 |
| INC-3 | Deck-cycle states + contention (§§11-12) | AC-13..AC-14 | INC-1 |
| INC-4 | Strike preparation + launch + recovery (§§13-18) | AC-15..AC-20 | INC-1, INC-3 |
| INC-5 | Carrier maneuver + wind-over-deck (§§19-20) | AC-21..AC-22 | INC-1 |
| INC-6 | Hazards + night ops + weather suspension (§§21-25) | AC-23..AC-27 | INC-1 |
| INC-7 | Recovery priority + ordnance + deck/hangar damage (§§26-28) | AC-28..AC-30 | INC-1, INC-6 |
| INC-8 | Records + ordering + reason codes (§§29-31) | AC-31..AC-33 | INC-1..INC-7 |
| INC-9 | Engine wiring + contracts rollup + two-process + gate | AC-34..AC-37 | INC-1..INC-8 |

### 1.7 Contract plan

15 `*_v1` contracts (resolved during ticket 06):

1. `CarrierOperationsState_v1`
2. `CarrierCapacityAssignment_v1`
3. `OversizedCarrierPolicy_v1`
4. `CarrierSpotValue_v1`
5. `JetCarrierCapability_v1`
6. `CarrierDeckCycleState_v1`
7. `CarrierDeckContention_v1`
8. `CarrierStrikeState_v1`
9. `CarrierLaunchRate_v1`
10. `CarrierWindOverDeck_v1`
11. `CarrierHazardExposure_v1`
12. `CarrierNightRecovery_v1`
13. `CarrierWeatherSuspension_v1`
14. `CarrierRecoveryPriority_v1`
15. `CarrierOrdnanceState_v1`

## 2. Key implementation decisions (to confirm during implementation)

- **State location**: `NationState.carrierOperations` as a `Record<ShipId, CarrierOperationsState>`.
- **Phase stage**: order 7.3, `rngAllowed: true`, after `resolve_aircraft_development` (7.2).
- **Tactical integration**: minimal — D-2 only powers up carrier operations state at the strategic level. Minute-advance tactical carrier operations integration in D-3.
- **Contracts pattern**: follow D-1's `*_v1` naming, fail-closed `validate*Contract` guards.
- **Reason codes**: all 21 shipped, no markers. Set-equality test per C/D pattern.
- **Two-process child**: new `run-carrier-operations-child.ts` following `run-aircraft-child.ts` pattern.
- **Goldens**: regenerate when `resolve_carrier_operations` phase wires in (ADR-0007 process). Document old/new hashes.