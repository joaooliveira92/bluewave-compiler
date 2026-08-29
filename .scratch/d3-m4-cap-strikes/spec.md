# D-3 Spec — M4 Aviation: CAP & Strikes (tactical air-combat integration)

- **Sprint:** D-3 (`docs/SPRINT-PLAN.md` Track D row 3)
- **Kind:** implementation (this spec is the output of the D-3 scoping sprint)
- **Governing docs:** DESIGN-43 §§22-31 (mission roles, fighter/torpedo/dive/patrol/floatplane/airship/jet/helicopter roles, squadron mission eligibility, inventory allocation), DESIGN-44 §§13-18 (strike prep/launch/recovery — D-2 shipped; D-3 uses for tactical execution), DESIGN-38 (minute-advance engine, records/ordering pattern).
- **Cross-references:** DESIGN-43 §§1-21 (aircraft model definitions, development, squadrons, basing — D-1), DESIGN-44 §§1-12, 19-33 (carrier state, spot, jet, deck cycles, contention, maneuver, wind, hazards, night, weather, ordnance, damage, records — D-2), DESIGN-39 (gunnery accuracy factor pattern), DESIGN-40 (torpedo hit resolution pattern, used for air-launched torpedoes), DESIGN-41 (damage pipeline, B-4/C-5).
- **Baseline:** D-1 COMPLETE (aircraft models, squadrons, basing, phase wiring). D-2 COMPLETE (carrier operations state, deck cycles, contention, launch rates, recovery, records, contracts, phase wiring). M1+M2+M3 completed. `BattleResolver`/`StrengthCalculator` unmodified throughout.
- **Target:** Deterministic, pure CAP (Combat Air Patrol) and strike mission execution within the minute-advance tactical combat engine — mission role feasibility predicates (DESIGN-43 §§22-31), CAP tick resolution (interception, air-to-air combat via researched 6-factor exchange formula), strike lifecycle (launch→formation→transit→attack→egress→recovery), ship attack via bomb/torpedo damage feeding into existing `resolveDamage`, new minute-advance stages (substep before gunnery).
- **Delivery contract:** ENGINEERING-CONTRACT.md binding. Goldens regenerate when new minute stages wire in (ADR-0007). `BattleResolver`/`StrengthCalculator` unmodified.

---

## 1. Scope

D-3 delivers CAP and strike mission execution in the minute-advance tactical engine. Aircraft state (models, squadrons, basing), carrier operations state (deck cycles, spot, launch rates, recovery priority), and the strategic carrier phase (D-2's `resolve_carrier_operations`) are already shipped. D-3 adds the tactical-minute integration: CAP patrol lifecycle, air-to-air exchange resolution, strike mission lifecycle, bombing/torpedo attack resolution, and damage pipeline integration.

### 1.1 In scope

1. **Mission role feasibility (§§22-31)** — squadron eligibility checks per DESIGN-43 §33 for CAP, ESCORT, INTERCEPTION, TORPEDO_ATTACK, LEVEL_BOMBING, DIVE_BOMBING. Aircraft availability (§34). These are predicates consumed by D-3 but largely shipped in D-1 (role eligibility per model, `AIRCRAFT_MISSION_ROLE_INELIGIBLE`).

2. **CAP tactical lifecycle** — CAP patrol station per squadron in battle state. Detection of incoming strikes via B-2 spotting. Interception timing (speed-score → m/s → intercept time). Per-minute engagement resolution.

3. **Air-to-air combat exchange** — squadron-quality 6-factor formula (quality, numericalAdvantage, altitude, surprise, defenderSurvival, escort) per grounded research (`docs/research/d3-m4-air-combat-model.md`). One RNG draw per engaging pair per minute. Losses + disruption.

4. **Strike mission tactical lifecycle** — state transitions (EN_ROUTE → ON_TARGET → ATTACKING → EGRESSING → RETURNING). Transit time calculation. Attack cadence (one pass per minute). Egress and recovery (uses D-2 recovery priority).

5. **Bombing attack resolution** — base bomb accuracy formula with disruption modifier. Dive bombing: 12_500bp accuracy bonus, 8_500bp penetration. Level bombing: baseline. Skip bombing: doctrine-gated.

6. **Air-launched torpedo attack** — reuse C-1 torpedo hit resolution with air-launch modifications (drop speed/altitude, minimum run).

7. **Damage pipeline integration** — bomb/torpedo hits create damage packages fed into existing `resolveDamage` (B-4/C-5). No duplicate damage resolver.

8. **Minute-advance engine wiring** — new `resolveAirCombat` stage (substep 1, before gunnery substep 2). CAP interception resolves during transit, attack resolves when strike is on-target.

9. **Records + ordering** — new `AirCombatRecord` for every engagement, loss, and attack event. Ordered per DESIGN-38 §29 + DESIGN-43 §39.

10. **Reason codes + contracts** — new reason code set for air-combat. `air_combat_v1` contract with 6-factor manifest.

### 1.2 Acceptance criteria

| AC | Requirement | Proving test |
|----|-------------|--------------|
| AC-1 | **CAP patrol state** — every CAP-eligible squadron in battle has `CapPatrolState` (station, altitude, fuel remaining, engagement state). Missing/invalid → `AIR_COMBAT_INVALID_STATE` | `air-combat/cap-patrol-state.test.ts` |
| AC-2 | **Detection of incoming strikes** — CAP detects strike formations via B-2 spotting model. Detection range depends on relative spotting/sensor values. Undetected strikes reach target without CAP interception. | `air-combat/detection.test.ts` |
| AC-3 | **Interception timing** — time to intercept = `ceil(distanceM / max(1, interceptSpeedMps * 60))`. Speed score → m/s via `2.5x + 20`. Delay or fast-intercept per relative speed and intercept angle. | `air-combat/interception-timing.test.ts` |
| AC-4 | **CAP vs escort engagement** — CAP allocated proportionally: `capToEscortBp = floor(escortCount * 10_000 / max(1, escortCount + capCount))`. Exchange resolves per 6-factor formula. | `air-combat/cap-vs-escort.test.ts` |
| AC-5 | **Air-to-air exchange formula** — 6 factors (quality, numericalAdvantage, altitude, surprise, defenderSurvival, escort). Integer bp arithmetic, floor-once, keyed RNG draw. `killProbabilityBp = floor(PI(factorBp) / 10_000^6)`. Losses = `floor(killProb * defenderCount / 10_000)`. | `air-combat/exchange-formula.test.ts` |
| AC-6 | **CAP vs bomber engagement** — remaining CAP (after escort) engages bombers. Bombers do not return fire. Losses + disruption applied. | `air-combat/cap-vs-bomber.test.ts` |
| AC-7 | **Strike disruption** — surviving bombers have disruption multiplier: `disruptionBp = max(5_000, 10_000 - floor(capEngaging * 1_000 / max(1, strikeAircraft)))`. Applied to bombing accuracy. | `air-combat/disruption.test.ts` |
| AC-8 | **Strike mission state machine** — valid transitions: EN_ROUTE→ON_TARGET→ATTACKING→EGRESSING→RETURNING→(recovery). Invalid → `AIR_COMBAT_INVALID_STRIKE_TRANSITION`. | `air-combat/strike-state-machine.test.ts` |
| AC-9 | **Transit time** — time to target = `ceil(distanceM / speedMps * 60)` considering formation speed (slowest aircraft). Multiple minutes for long-range strikes. | `air-combat/transit-time.test.ts` |
| AC-10 | **Bombing accuracy formula** — base accuracy = f(payload, altitude, visibility, target maneuver). Disruption reduces accuracy. Dive bombing: 12_500bp bonus vs level bombing. Level bombing: baseline 10_000bp. | `air-combat/bombing-accuracy.test.ts` |
| AC-11 | **Dive-bombing penetration** — 8_500bp penetration multiplier relative to equal-mass level bomb. Does not change bomb explosive mass. | `air-combat/dive-bombing.test.ts` |
| AC-12 | **Air-launched torpedo attack** — reuse C-1 hit resolution with air-launch modifiers (drop speed ≥ threshold, drop altitude range, min run distance). Air-launch has higher closing speed → hit bonus. | `air-combat/torpedo-attack.test.ts` |
| AC-13 | **Damage integration** — bomb/torpedo hits create `AirAttackDamagePackage` feeding into `resolveDamage` pipeline (B-4 §INC-4/5, C-5). No duplicate resolver. Bomb penetration uses existing armor model. | `air-combat/damage-integration.test.ts` |
| AC-14 | **Strike egress** — after attack, strike transitions to EGRESSING then RETURNING. Fuel check: insufficient fuel → ditch/loss. | `air-combat/egress.test.ts` |
| AC-15 | **Recovery integration** — returning aircraft use D-2 recovery priority (§26). Deck state, wind, weather pass. Loss risk per D-2 §24 night/day. | `air-combat/recovery.test.ts` |
| AC-16 | **Minute-advance stage wiring** — new `resolveAirCombat` stage (substep 1, after movement/spotting, before gunnery substep 2). Optional — strict no-op when no CAP/strike aircraft present preserves prior goldens. | `combat/integration.test.ts` |
| AC-17 | **AirCombatRecord** — every engagement, loss, attack, and state transition creates immutable record with all DESIGN-43 §38 fields + record hash. | `air-combat/records.test.ts` |
| AC-18 | **Canonical ordering** — ordering per DESIGN-43 §39 + DESIGN-38 §29: battles by id, squadrons by id, engagements by minute+step+attacker+defender, losses by squadron+aircraft+timestamp. | `air-combat/ordering.test.ts` |
| AC-19 | **Reason-code set-equality** — D-3 ships all in-scope reason codes with set-equality guard. No deferred markers for in-scope codes. | `air-combat/reason-codes-rollup.test.ts` |
| AC-20 | **Contracts** — `air_combat_v1` contract with 6-factor manifest shipped + `validateAirCombatContract` fail-closed guard. | `air-combat/contracts.test.ts` |
| AC-21 | **Two-process determinism** — identical state+inputs produce identical hashes and records. Verified by child process (byte-compared). | `cross-process-test/run-air-combat-child` |
| AC-22 | **`BattleResolver`/`StrengthCalculator` unmodified** — verified by diff; integration-boundary test proves zero wiring. | orchestrator gate |

### 1.3 Out of scope (deferred)

- AA / air defense (D-4)
- Experience/fatigue binding (DESIGN-28, unassigned)
- Multiple CAP engagement passes per tactical minute (future)
- Fuel endurance model beyond basic check (future M4)
- Aircraft production pipeline (DESIGN-43 §37)
- Content YAML constants (CONTENT-track)
- Player UI for CAP/strike management (desktop-track)
- Strategic AI mission planning (AI package)
- SAM/missile air engagement (E-track)

### 1.4 Reason-code ship map

Shipped (16 codes):

`AIR_COMBAT_INVALID_STATE`, `AIR_COMBAT_INVALID_STRIKE_TRANSITION`, `AIR_COMBAT_QUALITY_OUT_OF_RANGE`, `AIR_COMBAT_ATTACKER_ZERO_STRENGTH`, `AIR_COMBAT_NO_AVAILABLE_TARGET`, `AIR_COMBAT_INTERCEPTION_TOO_LATE`, `AIR_COMBAT_ESCORT_ZERO_STRENGTH`, `AIR_COMBAT_STRIKE_ZERO_STRENGTH`, `AIR_COMBAT_DETECTION_FAILED`, `AIR_COMBAT_BOMBING_PARAMETERS_INVALID`, `AIR_COMBAT_TORPEDO_ATTACK_INELIGIBLE`, `AIR_COMBAT_ATTACK_NO_DAMAGE`, `AIR_COMBAT_STRIKE_FUEL_INSUFFICIENT`, `AIR_COMBAT_RECOVERY_DECK_UNAVAILABLE`, `AIR_COMBAT_RECORD_INTEGRITY_FAILURE`, `AIR_COMBAT_INVARIANT_FAILED`.

Deferred markers (3): `AIR_COMBAT_AA_INTERCEPTION` (D-4), `AIR_COMBAT_EXPERIENCE_MODIFIER` (DESIGN-28), `AIR_COMBAT_FUEL_EXHAUSTION` (future).

### 1.5 Minute-advance stage update

New stage in the tactical minute pipeline:

| Step | Stage | Substep | Notes |
|------|-------|---------|-------|
| 0 | `resolveWeather` | — | B-5/B-6 |
| 1 | **`resolveAirCombat`** | **1** | **NEW — CAP interception & strike attack** |
| 2 | `resolveMovement` | — | B-2 |
| 2.1 | `resolveSpotting` | — | B-2 |
| 2.2 | `resolveGunnery` | 2 | B-3 |
| 3 | `resolveTorpedo` | 3 | C-1 |
| 4 | `resolveDamage` | 4 | B-4 |
| 4.5 | `resolveSmoke` | — | C-5 |
| 5 | `resolveDamageControl` | — | C-5 |

`resolveAirCombat` at step 1 ensures CAP intercepts strikes BEFORE gunnery/torpedo stages resolve. Strict no-op when no CAP/strike aircraft present preserves prior golden hashes.

### 1.6 Contract plan

1. `air_combat_v1` — policy constants, factor manifest (6 factors), formula version
2. `cap_patrol_state_v1` — CAP patrol state schema
3. `strike_mission_state_v1` — strike tactical mission state schema
4. `air_combat_exchange_v1` — exchange outcome schema
5. `air_combat_records_v1` — record schema

### 1.7 Implementation increments

| INC | Deliverable | ACs | Blocked by |
|-----|-------------|-----|------------|
| INC-1 | CAP patrol state + detection + interception timing | AC-1, AC-2, AC-3 | none |
| INC-2 | Air-to-air exchange formula + CAP vs escort/CAP vs bomber | AC-4, AC-5, AC-6 | INC-1 |
| INC-3 | Strike disruption + strike state machine | AC-7, AC-8 | INC-2 |
| INC-4 | Transit time + bombing accuracy + dive bombing | AC-9, AC-10, AC-11 | INC-3 |
| INC-5 | Air-launched torpedo attack + damage integration | AC-12, AC-13 | INC-4 |
| INC-6 | Strike egress + fuel check + recovery integration | AC-14, AC-15 | INC-5 |
| INC-7 | Records + ordering + reason codes + contracts | AC-17, AC-18, AC-19, AC-20 | INC-1..INC-6 |
| INC-8 | Engine wiring + two-process + gate | AC-16, AC-21, AC-22 | INC-1..INC-7 |

### 1.8 Key implementation decisions (to confirm during implementation)

- **State location**: `BattleState.airCombat` — new field containing CAP patrol states, strike mission states, and engagement outcomes. Separate from ship/unit states.
- **Minute stage**: step 1, substep 1, after weather, before gunnery (substep 2). Strict no-op preserves prior goldens.
- **CAP patrol**: each CAP-eligible squadron can establish patrol at battle start. Patrol station = carrier/formation guarding position.
- **Detection**: uses B-2 spotting model — incoming strikes spotted at sensor range. If not spotted, CAP doesn't intercept.
- **Air-to-air formula**: 6-factor squadron-quality exchange per research. Keyed RNG per engagement pair per minute.
- **Bomb damage**: bomb/torpedo hits create lightweight `AirAttackDamagePackage` that feeds into `resolveDamage`. Bomb penetration uses existing armor model zones/maxima.
- **Air torpedo**: reuse C-1 `resolveTorpedoHit` with air-launch predicate overrides. Not a new torpedo resolver.
- **Records**: new `AirCombatRecord` per DESIGN-43 §38. Follow D-1 `AircraftRecord` pattern.
- **Goldens**: regenerate when `resolveAirCombat` wires in (ADR-0007 process). Document old/new hashes.

---

## 2. Implementation tickets (frontier-ordered)

See `.scratch/d3-m4-cap-strikes/issues/INC-*.md` — 8 implementation tickets, blocks wired: