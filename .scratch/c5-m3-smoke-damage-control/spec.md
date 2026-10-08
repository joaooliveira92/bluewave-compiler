# C-5 Spec — M3 Smoke + Detailed Damage Control (M3 Advanced Surface Warfare)

- **Sprint:** C-5 (`.ai/SPRINT-PLAN.md` Track C row 5)
- **Kind:** scoping (this document is the implementation spec; C-5-IMPL executes it)
- **Governing docs:** DESIGN-42 §§7-23 (`docs/rules/weather-visibility-and-smoke.md` — smoke: drift/decay/screens/floats/generators) + DESIGN-41 remainder (`docs/rules/damage-fire-and-flooding.md` §§13-22, §24-25, §27-28 — fire propagation, flooding control, damage-control resources); cross-refs DESIGN-38 (minute-advance engine, `BattleLedger`), DESIGN-07 (integer arithmetic), DESIGN-55 §4 (M3 scope).
- **Baseline:** M2 COMPLETED (B-6 gate). C-1 (torpedoes) COMPLETE, C-2 (mines) COMPLETE, C-3 (submarines) COMPLETE, C-4 (coastal defenses) COMPLETE. `@bluewave/combat` has full tactical pipeline including B-4's damage pipeline (armor, hit location, component damage, structure/flotation, immediate fire/flooding creation, magazine hazard, basic SINKING/FOUNDERED). B-5's weather/visibility module (DESIGN-42 §§1-6) is wired into the minute-advance engine.
- **Target:** smoke module + damage-control extension reaches `VERIFIED_NOT_INTEGRATED` (phase/snapshot integration deferred to C-6); golden hashes **will change** because smoke drift/decay wires into the minute-advance engine per Decision 03 (ADR-0040, regeneration under ADR-0007).

---

## 1. Scope

C-5 delivers two coordinated modules in `@bluewave/combat`:

**A. Tactical smoke module** (`packages/combat/src/smoke/`): full DESIGN-42 §§7-23 lifecycle — SmokeCloud model, drift/decay, line intersection, fire-through-smoke, funnel smoke, smokescreen eligibility/generation/cooldown/density/effects, smoke-float technology/capacity/deployment, smoke-generator technology/policy/capacity, source precedence, event records, canonical ordering, reason codes, versioned contracts.

**B. Damage-control extension** (`packages/combat/src/damage/` extension): DESIGN-41 §§13-22, §24-25, §27-28 — fire state resolution (propagation/spread/suppression), fire-rate-of-fire penalty, fire night visibility, fire smoke (couples with smoke module), flooding state/severity/control, damage-control resources/priority.

### 1.1 Acceptance criteria

| AC | Requirement | Proving test |
|----|-------------|--------------|
| AC-1 | **SmokeCloud model** (§7) — every cloud has: id, source type (5-value), source id, owner, creation minute/substep, centroid, density (1..10_000), drift vector, expansion rate, decay rate, fuel/composition, active status, hash. Missing/invalid → `INVALID_SMOKE_CLOUD`. | `smoke/smoke-cloud.test.ts` |
| AC-2 | **Drift, decay, line intersection** (§8-9) — per-minute translation by wind vector; density reduction via wind retention multiplier bands; `smokeOpticalMultiplierBp = max(1_000, 10_000 - floor(totalPathDensityBp * 8_000 / 10_000))`. | `smoke/drift-decay.test.ts`, `smoke/line-intersection.test.ts` |
| AC-3 | **Smokescreen lifecycle** (§12-16) — eligibility predicate (DD/CL, equipment, consumable, ≥5kt, no cooldown, etc.); 5-min generation; 20-min cooldown from first emission; initial density 9_000, width 500m, height 100m; no invulnerability/guaranteed withdrawal. | `smoke/smokescreen.test.ts` |
| AC-4 | **Funnel smoke (§11) + smoke floats (§17-19)** — fuel/power multipliers; float tech requirement (CL, 3-mo doctrine); capacity 4; deployment ≤25kt, 5-min 8_500 density; generator (§20-22) 5-min, 20-min cooldown, 3 charges, 9_000 density. | `smoke/funnel-smoke.test.ts`, `smoke/smoke-floats.test.ts`, `smoke/smoke-generator.test.ts` |
| AC-5 | **Source precedence (§23)** — funnel + one deliberate source simultaneous; no simultaneous floats + generator; overlapping compatible clouds merge under §8. Mode conflict → `SMOKE_EQUIPMENT_MODE_CONFLICT`. | `smoke/source-precedence.test.ts` |
| AC-6 | **Fire resolution (§19-22, §24-25)** — per-minute fire spread/suppression; 4-band ROF penalty; 5-band night signature; `smokeStrength = floor(fireIntensity * fuelMultiplier * ventilationMultiplier / 10_000^2)`; ship-type risk multipliers (carrier 15_000, etc.). | `damage/fire-resolution.test.ts` |
| AC-7 | **Flooding resolution (§13-18)** — per-minute ingress vs pumping; 4-band severity (MINOR/SERIOUS/MAJOR/CRITICAL); speed/stability multipliers; 10kt control threshold; high-speed loss check per-minute (≥20kt, MAJOR+); `netFloodingDelta = max(0, floor(totalIngress * speedPressureBp * progressiveFailureBp / 10_000^2) - effectivePumping - effectiveRepairReduction)`. | `damage/flooding-resolution.test.ts` |
| AC-8 | **Damage-control resources (§27-28)** — teams, pumping, firefighting, power, crew, priorities (9-step); no double-allocation; `allocateDamageControl` by priority order. | `damage/damage-control.test.ts` |
| AC-9 | **Engine wiring** — `resolveSmoke` stage (step 5.5) after weather, before spotting; `resolveDamageControl` stage (step 8.6) after `resolveDamage`; strict no-op when no smoke/fire/flooding → pre-smoke battle hashes unchanged; `resolveGunnery` receives smoke optical multiplier. | `smoke/engine-wiring.test.ts`, `damage/engine-wiring.test.ts` |
| AC-10 | **Records + canonical ordering** — `SmokeEventRecord` (§28) + damage-control records (§45) with all fields; §29/§46 ordering; deterministic sort. | `smoke/smoke-records.test.ts`, `damage/damage-control-records.test.ts` |
| AC-11 | **Reason-code set-equality** — in-slice smoke (§30) + damage-control (§47 subset) codes; set-equality tests prevent silent addition; deferred codes recorded, never shipped; retired marker never re-added; disjointness proof. | `smoke/reason-codes-smoke.test.ts`, `damage/reason-codes-damage-control.test.ts` |
| AC-12 | **Contracts + validate guards** — every new constant ships `*_v1` + `SHIPPED_*_CONTRACT` + `validate*Contract` fail-closed guards; `validateAllSmokeContracts` + `validateAllDamageControlContracts` rollup. | `smoke/contracts.test.ts`, `damage/contracts.test.ts` |
| AC-13 | **Two-process determinism** — identical battle state+inputs → identical per-minute hashes + smoke/damage-control events; two child processes (node-spawn ×2, byte-compared). | `smoke/determinism.test.ts` + cross-process child |
| AC-14 | **No snapshot/phase change** — no phase-engine registration, no snapshot schema change; `BattleResolver`/`StrengthCalculator`/campaign-engine unmodified (diff). | `smoke/integration-boundary.test.ts`, `damage/damage-control-integration-boundary.test.ts` |
| AC-15 | **Goldens regenerated (documented)** — ADR-0007 process; old/new hashes + authoritative cause (smoke stage wires into minute-advance, changing per-minute hashes). | orchestrator gate |

### 1.2 In scope (INCs)

| INC | Title | ACs | Files |
|-----|-------|-----|-------|
| INC-1 | Smoke cloud model + constants + reason codes seed + contracts seed | AC-1 (partial), AC-11 (seed), AC-12 (seed) | `model.ts`, `constants.ts`, `reasonCodes.ts`, `contracts.ts`, `funnelSmoke.ts`, `index.ts` |
| INC-2 | Smoke drift, decay, line intersection | AC-2 | `driftDecay.ts`, `lineIntersection.ts` |
| INC-3 | Smokescreen eligibility, generation, cooldown, effects | AC-3 | `smokescreen.ts` |
| INC-4 | Smoke floats, generators, source precedence | AC-4, AC-5 | `smokeFloats.ts`, `smokeGenerator.ts`, `sourcePrecedence.ts` |
| INC-5 | Fire propagation and state resolution | AC-6 | `fireResolution.ts`, `fireConstants.ts` |
| INC-6 | Flooding state and control | AC-7 | `floodingResolution.ts`, `floodingConstants.ts` |
| INC-7 | Damage-control resources and priority | AC-8 | `damageControl.ts`, `damageControlConstants.ts` |
| INC-8 | Engine wiring + records + ordering + two-process determinism | AC-9, AC-10, AC-13 | `smokeRecords.ts`, `engineWiring.ts`, `damageControlEngineWiring.ts` |
| INC-9 | Contracts rollup + reason-code set-equality + ADR + gate | AC-11, AC-12, AC-14, AC-15 | `contractRollup.ts`, tests, ADR-0040 |

### 1.3 Shipped constants

- `smoke_constants_v1`: fire smoke decal constants (wind retention multipliers, reference path length, optical multiplier 8_000/10_000)
- `funnel_smoke_profile_v1`: fuel multipliers (coal 15_000, mixed 12_500, oil 7_500, nuclear 0), power-setting multipliers (5 bands)
- `smokescreen_params_v1`: initial density 9_000, reference width 500m, vertical extent 100m, generation duration 5min, cooldown 20min
- `smoke_float_params_v1`: capacity 4, deployment max speed 25kt, emission duration 5min, initial density 8_500, width 400m
- `smoke_generator_params_v1`: duration 5min, cooldown 20min, charges 3, density 9_000, width 500m
- `fire_risk_multipliers_v1`: ship-type fire-risk multipliers (§20)
- `fire_rate_of_fire_penalty_v1`: 4-band ROF multipliers (§22)
- `fire_night_signature_v1`: 5-band multipliers (§24)
- `flooding_severity_thresholds_v1`: 500/1_500/3_000 bp (§14)
- `flooding_speed_stability_v1`: speed/stability multipliers per severity (§15)
- `flooding_control_thresholds_v1`: 10kt control speed, speed-pressure 6 bands (§16)
- `flooding_high_speed_loss_v1`: base probability 4-case table (§17)
- `damage_control_constants_v1`: resource types, priority order (§27-28)

### 1.4 Reason codes (smoke — in-slice)

From DESIGN-42 §30:
- `INVALID_SMOKE_CLOUD`
- `SMOKE_LINE_INTERSECTION_FAILED`
- `SMOKESCREEN_SHIP_INELIGIBLE`
- `SMOKESCREEN_EQUIPMENT_UNAVAILABLE`
- `SMOKESCREEN_CONSUMABLE_UNAVAILABLE`
- `SMOKESCREEN_COOLDOWN_ACTIVE`
- `SMOKESCREEN_GENERATION_INTERRUPTED`
- `SMOKE_FLOAT_TECHNOLOGY_UNAVAILABLE`
- `SMOKE_FLOAT_CAPACITY_MISSING`
- `SMOKE_FLOAT_INVENTORY_EMPTY`
- `SMOKE_FLOAT_DEPLOYMENT_SPEED_EXCEEDED`
- `SMOKE_GENERATOR_TECHNOLOGY_UNAVAILABLE`
- `SMOKE_GENERATOR_CHARGES_EMPTY`
- `SMOKE_EQUIPMENT_MODE_CONFLICT`
- `WEATHER_SMOKE_STATE_INVARIANT_FAILED`
- `SMOKE_RESOLUTION_DEFERRED` (marker for deferred items)

### 1.5 Reason codes (damage-control — in-slice, extending B-4)

From DESIGN-41 §47 (new or extended):
- `FLOODING_HIGH_SPEED_LOSS_CHECK`
- `FIRE_SOURCE_CREATED` (extended — was creation-only in B-4)
- `FLOODING_SOURCE_CREATED` (extended — was creation-only in B-4)
- `SHIP_MISSION_KILLED`
- `SHIP_SINKING` (extended — basic in B-4, now full per-minute)
- `SHIP_STABILIZED`
- `CARRIER_OPERATIONS_OBSTRUCTED_BY_FIRE`
- `ALUMINUM_SUPERSTRUCTURE_FIRE_VULNERABILITY`
- `DAMAGE_CONTROL_RESOLUTION_DEFERRED` (marker)

### 1.6 Deferred (recorded)

All deferred per decision tickets 01-07:

- **Full secondary hazards (§10-11 items 2-9):** torpedo/mine-store reaction, aviation-fuel reaction, boiler/machinery reaction, electrical short, steering/bridge disruption, crew-casualty — beyond the B-4 magazine hazard. **Deferred to C-5 continuation or C-6.**
- **Aluminum superstructure (§26):** standalone design-feature constant set. **Deferred to C-5 continuation.**
- **Full terminal state machine (§29-43):** MISSION_KILLED (§30), full state transitions, scuttling/capture/recovery (§35), sinking credit (§36), victory-point timing (§37), post-battle adjudication (§38), survivors/rescue (§39-43). **Deferred to C-5 continuation.**
- **Performance update integration (§12):** full per-minute performance recomputation from fire/flooding state. **Deferred** (basic performance update already runs in B-4; C-5 adds fire/flooding effects to the existing update).
- **Smoke affecting gunnery/torpedo/spotting:** the `smokeOpticalMultiplierBp` from line intersection is computed per-minute but applying it to gunnery accuracy, torpedo observation, and spotting likelihood requires modifying the gunnery/spotting formulas (out of scope for pure smoke module). **Deferred until the integration pass.** The multiplier is computed and recorded; consumers wire later.
- **Phase-engine/snapshot wiring:** no COASTAL_DEFENSE snapshot field, no campaign smoke state. **Deferred to C-6.**
- **YAML-authored constants:** currently TypeScript constants. **Deferred.**

---

## 2. Implementation plan (INC order with blocking edges)

```
INC-1 (model + constants + reason codes + funnel smoke)
  │
  ├──→ INC-2 (drift/decay/intersection — needs model)
  │       │
  │       └──→ INC-3 (smokescreen — needs drift for segment lifetime)
  │       └──→ INC-4 (floats/generators — needs drift/decay)
  │
  ├──→ INC-5 (fire resolution — needs model for §25 fire smoke coupling)
  │       │
  │       └──→ INC-7 (damage-control resources — needs fire sources to allocate)
  │
  ├──→ INC-6 (flooding resolution — independent of smoke)
  │       │
  │       └──→ INC-7 (damage-control resources — needs flooding sources)
  │
  └──→ INC-8 (engine wiring + records + determinism — needs all above)
          │
          └──→ INC-9 (contracts rollup + reason-code set-equality + ADR + gate)
```

INC-1 first (unblocked). INC-2, INC-5, INC-6 parallel after INC-1 (independent of each other). INC-3/INC-4 after INC-2. INC-7 after INC-5/INC-6. INC-8 after INC-2/INC-5/INC-6/INC-7. INC-9 after INC-8.

`BattleResolver`/`StrengthCalculator` unmodified throughout.