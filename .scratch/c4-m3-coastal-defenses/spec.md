# C-4 Spec — M3 Coastal Defense: Coastal Artillery & Land-Target Damage Model (M3 Advanced Surface Warfare)

- **Sprint:** C-4 (`.ai/SPRINT-PLAN.md` Track C row 4)
- **Kind:** scoping (this document is the implementation spec; C-4-IMPL executes it)
- **Governing docs:** DESIGN-48 (`docs/rules/coastal-defense.md`) — full 48-line doc in scope; cross-refs DESIGN-14 (mine pressure — coastal artillery increases local mine pressure), DESIGN-08 (determinism — seed-driven placement), DESIGN-07 (integer arithmetic), DESIGN-55 §4 (M3 scope: torpedoes/mines/submarines/coastal-defenses/smoke/detailed-damage-control).
- **Baseline:** M2 COMPLETED (B-6 gate). C-1 (torpedoes) COMPLETE, C-2 (mines) COMPLETE, C-3 (submarines) COMPLETE. `@bluewave/combat` has the full tactical pipeline plus mines, submarines, weather modules.
- **Target:** coastal-defense value model reaches `VERIFIED_NOT_INTEGRATED` (phase/snapshot integration deferred); no campaign snapshot schema change; golden hashes unchanged.

---

## 1. Scope

C-4 delivers a deterministic, pure **coastal defense value model** in a new `packages/combat/src/coastal-defense/` module: coastal artillery battery definitions (model, caliber, era-band, AA capability), land-target type classification (7 types), land-target damage state (5-state progression), coastal artillery participation in local battles (value-only effectiveness contribution), local mine-pressure contribution (produces an `AreaMinePressureRecord` via C-2's model), placement rules (predefined zones + seed-driven selection), records, canonical ordering, and reason codes.

### 1.1 Acceptance criteria

| AC | Requirement (DESIGN-48 + contract) | Proving test |
|----|-------------------------------------|--------------|
| AC-1 | **Coastal battery definition** — every battery has: type id (authored string), caliber (mm, SafeInt), era band (EARLY/PRE_WAR/INTERWAR/MID_CENTURY/LATE), hasAA (boolean for "gains AA capability over time"); missing/invalid → `INVALID_COASTAL_BATTERY_DEFINITION`. | `coastal-defense/battery-definition.test.ts` |
| AC-2 | **Land target types** — all 7 types (`AIRFIELD`/`DOCKYARD`/`FUEL_STORAGE`/`RADAR_STATION`/`COASTAL_BATTERY`/`PORT_INSTALLATION`/`TRANSPORT_CONCENTRATION`) discriminated; unknown → `UNKNOWN_LAND_TARGET_TYPE`. | `coastal-defense/land-target-types.test.ts` |
| AC-3 | **Damage state progression** — 5-state linear progression (Intact→Suppressed→Damaged→Disabled→Destroyed); damage application requires typed event (`BOMBARDMENT`/`SHELLING`/`ASSAULT`); invalid transition → `INVALID_DAMAGE_STATE_TRANSITION`; destroyed is terminal. | `coastal-defense/damage-states.test.ts` |
| AC-4 | **Placement** — `selectCoastalDefensePositions(areaId, validZones, rng, seed)` returns positions from valid zones; seed-driven via keyed stream `coastal_defense/placement/<areaId>/<seed>`; zone not in valid set → `COASTAL_DEFENSE_PLACEMENT_ZONE_INVALID`; empty valid zones → empty result. | `coastal-defense/placement.test.ts` |
| AC-5 | **Local mine-pressure contribution** — coastal artillery increases local mine pressure by a fixed per-battery amount (shipped constant); produces `AreaMinePressureRecord` via C-2's model; task uses C-2's `createMinePressureRecord`; missing type → `COASTAL_ARTILLERY_MINE_PRESSURE_MISSING`. | `coastal-defense/mine-pressure.test.ts` |
| AC-6 | **Value-only effectiveness** — `coastalArtilleryEffectivenessBp(battery, targetType, seaState)` returns a BigInt bp value (floor); pure function, no side effects; sealed with `COASTAL_DEFENSE_EFFECTIVENESS_FORMULA_MISSING` guard. | `coastal-defense/effectiveness.test.ts` |
| AC-7 | **Records + canonical ordering** — one `CoastalDefenseOperationsRecord` per resolution with all fields; §26-equivalent ordering (possession id → area id → battery type → position); deterministic collection sort, no ambient order. | `coastal-defense/records.test.ts` |
| AC-8 | **Reason-code set-equality** — all in-slice reason codes ship; `reason-codes-coastal-defense.test.ts` partition (in-slice/deferred/catalog) prevents silent addition. | `coastal-defense/reason-codes-coastal-defense.test.ts` |
| AC-9 | **Contracts + validate guards** — every new constant ships `*_v1` + `SHIPPED_*_CONTRACT` + `validate*Contract` fail-closed guards. | `coastal-defense/contracts.test.ts` |
| AC-10 | **No engine/phase integration** — no phase-engine registration, no snapshot change; pure functions only; `BattleResolver`/`StrengthCalculator`/existing engine files unmodified. | `coastal-defense/integration-boundary.test.ts` |
| AC-11 | **Goldens unchanged** — no snapshot/phase change; `verify-golden-hashes.cjs` 10/10. | orchestrator gate |

### 1.2 In scope

1. **Coastal battery definitions + land target types + damage states + constants + reason codes seed** (INC-1): `CoastalBatteryDefinition` type, `LandTargetType` discriminated union (7 values), `LandTargetDamageState` (5-value enum), `coastal_defense_constants_v1` (per-battery mine pressure increment, base effectiveness, caliber validity range), in-slice reason codes module seed, contracts seed (AC-1, AC-2, AC-3, AC-8, AC-9 seeds).
2. **Placement rules** (INC-2): `selectCoastalDefensePositions` pure function, geographic zone model, seed-driven RNG stream, `COASTAL_DEFENSE_PLACEMENT_ZONE_INVALID` (AC-4).
3. **Damage state progression** (INC-3): `applyLandTargetDamage` pure function, 5-state linear progression, typed damage events, `INVALID_DAMAGE_STATE_TRANSITION`, terminal destroy (AC-3).
4. **Local mine-pressure contribution** (INC-4): `calculateCoastalArtilleryMinePressure` pure function, C-2 `createMinePressureRecord` seam, shipped increment constant, `COASTAL_ARTILLERY_MINE_PRESSURE_MISSING` (AC-5).
5. **Value-only effectiveness formula** (INC-5): `coastalArtilleryEffectivenessBp` BigInt formula (floor), `COASTAL_DEFENSE_EFFECTIVENESS_FORMULA_MISSING` guard (AC-6).
6. **Records + ordering + contracts rollup + reason-code set-equality** (INC-6): `CoastalDefenseOperationsRecord`, canonical ordering, validate guard rollup, set-equality test (AC-7, AC-8, AC-9, AC-10, AC-11).

### 1.3 Shipped constants

- `coastal_defense_constants_v1`: `PER_BATTERY_MINE_PRESSURE_INCREMENT`, `BASE_EFFECTIVENESS_BP`, `MIN_CALIBER_MM`, `MAX_CALIBER_MM`
- `land_target_damage_states_v1`: Intact/Suppressed/Damaged/Disabled/Destroyed
- `coastal_battery_era_bands_v1`: EARLY/PRE_WAR/INTERWAR/MID_CENTURY/LATE

### 1.4 Reason codes (in-slice)

- `INVALID_COASTAL_BATTERY_DEFINITION`
- `UNKNOWN_LAND_TARGET_TYPE`
- `INVALID_DAMAGE_STATE_TRANSITION`
- `COASTAL_DEFENSE_PLACEMENT_ZONE_INVALID`
- `COASTAL_ARTILLERY_MINE_PRESSURE_MISSING`
- `COASTAL_DEFENSE_EFFECTIVENESS_FORMULA_MISSING`
- `COASTAL_DEFENSE_RESOLUTION_DEFERRED` (marker for battle-integration items)

### 1.5 Deferred (recorded)

All deferred per decision tickets 01–06:

- Battle-participation integration (coastal artillery appearing in tactical battles) — needs tactical battle context (manifest/damage pipeline). **Deferred to C-4 continuation or M3 integration pass.**
- Campaign infrastructure consequence application after battle — needs campaign snapshot + B-6 battle-outcome wire. **Deferred.**
- AA capability progression over time — needs M4 AA system (DESIGN-45). **Deferred.**
- Airfield, radar site mechanics — these are M4/D-track capabilities. **Deferred; types are captured as discriminated union values only.**
- YAML-authored constants (currently shipped as TypeScript constants). **Deferred to C-4 continuation.**