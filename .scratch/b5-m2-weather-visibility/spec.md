# B-5 Spec — M2 Tactical Weather & Visibility (M2 Surface Tactical Core)

- **Sprint:** B-5 (`.ai/SPRINT-PLAN.md` Track B row 5)
- **Kind:** scoping → implementation (this document is the implementation spec; B-5-IMPL executes it)
- **Governing docs:** DESIGN-42 (`docs/rules/weather-visibility-and-smoke.md`) — **weather/visibility subset only** (§§1–6, §24–30); smoke (§§7–23) deferred to M3 per DESIGN-55 §4; cross-refs DESIGN-38 (minute-advance, `BattleLedger`, `canonicalEventOrder`, reason-code catalog), DESIGN-07 (integer arithmetic), DESIGN-55 §3 (M2 scope).
- **Baseline:** B-4-IMPL DONE (2026-08-14, PASS). `@bluewave/combat` has the B-2 minute-advance engine (`simulation/engine.ts` steps 4–8), B-3 `resolveGunnery` wired after spotting, B-4 `resolveDamage` wired after gunnery, `BattleLedger` + `canonicalEventOrder`, versioned `*_v1` contracts + validate guards, reason-code catalogs. `BattleResolver`/`StrengthCalculator` unmodified.
- **Target:** tactical weather & visibility reaches `IMPLEMENTED_UNVERIFIED → VERIFIED_NOT_INTEGRATED` (phase-pipeline integration + campaign persistence is B-6); no campaign snapshot schema change.
- **Delivery contract:** ENGINEERING-CONTRACT.md binding. Golden hashes unchanged (no ADR-0007 regeneration).

---

## 1. Scope

B-5 delivers a deterministic, pure, minute-advancing **tactical weather** engine
stage (`resolveWeather`) in `@bluewave/combat` running **before** spotting (step
after battle init, before B-2 step 5) in the minute-advance simulation,
implementing DESIGN-42 §§1–6 and §24–30 weather/visibility, emitting immutable
`WeatherEventRecord`s through the existing `BattleLedger` + `canonicalEventOrder`.
It ships the weather/visibility versioned constants + in-slice reason codes, and
a B-5 ADR.

Also adds a new **strategic** monthly phase `weather_generation` (order after
`opening_validation`, before `command_collection`) that generates per-area
`StrategicWeatherState` from canonical climate profiles.

### 1.1 Acceptance criteria (mapped to requirement IDs + tests)

| AC | Requirement (DESIGN-42 + contract) | Proving test |
|----|------------------------------------|--------------|
| AC-1 | **StrategicWeatherState invariant** — authoritative integer `StrategicWeatherState` (§1: areaId, month, climate profile, sea state 0..9, wind direction/speed, precipitation type/intensity, fog/mist density 0..10_000, cloud cover 0..10_000, daylight profile, glare eligibility, base visibility distance µm, generated-at phase, versions, state hash); non-integers rejected (`INVALID_STRATEGIC_WEATHER_STATE`). | `combat/test/weather/strategic-state.test.ts` |
| AC-2 | **Strategic weather generation** — monthly `weather_generation` phase (order after `opening_validation`) generates per-area `StrategicWeatherState` from canonical climate profile, calendar month, prior persistent state, and keyed RNG stream `campaign/weather/<areaId>/<month>`; missing climate → `WEATHER_PROFILE_INCOMPLETE`. | `combat/test/weather/strategic-generation.test.ts` |
| AC-3 | **BattleWeatherInitialization** — every battle creates one immutable `BattleWeatherInitialization` from the area's committed strategic weather state, battle date/time, location, mission template, local-variation policy, battle seed, and weather policy version; same area+overlapping time uses same strategic weather source. | `combat/test/weather/battle-init.test.ts` |
| AC-4 | **12 tactical weather components** — all §3 components use canonical integer units; non-integers rejected (`INVALID_TACTICAL_WEATHER_STATE`); `BattleWeatherComponents` carries a state hash. | `combat/test/weather/components.test.ts` |
| AC-5 | **Tactical weather progression** — progression at exactly 30-min intervals via climate profile transition tables and keyed stream `battle/weather/interval`; sea state ±1 max per interval; wind direction per climate band; each transition creates a `WeatherEventRecord`. | `combat/test/weather/progression.test.ts` |
| AC-6 | **Visibility distance formula** — `effectiveVisibility = floor(baseVisibility * precipMultiplierBp * fogMultiplierBp * daylightMultiplierBp * glareMultiplierBp * smokeMultiplierBp / 10_000^5)`; exact integer rational before FLOOR; missing factor → `WEATHER_VISIBILITY_FORMULA_MISSING`. | `combat/test/weather/visibility.test.ts` |
| AC-7 | **Glare** — directional, angular separation bands §24: <10°: 5_000 bp, 10–20°: 7_500, 20–30°: 9_000, ≥30°: 10_000; disabled when cloud cover >7_500 bp; observer looking toward sun receives penalty only. | `combat/test/weather/glare.test.ts` |
| AC-8 | **Fog/mist** — §25 density→visibility multiplier bands; affects optical observation and LOS signaling; radar uses own weather effects. | `combat/test/weather/fog.test.ts` |
| AC-9 | **Precipitation** — §26 visibility multiplier bands by intensity (none/light/moderate/heavy/extreme); also affects air ops, radar, sea state, smoke through owning contracts. | `combat/test/weather/precipitation.test.ts` |
| AC-10 | **Night/twilight** — five canonical states (§27): DAY, TWILIGHT_DAY, TWILIGHT_NIGHT, NIGHT, DAWN_DUSK_TRANSITION; derived from battle date/location/tactical time/daylight profile; each state supplies explicit optical visibility, identification, gunnery, air-op, and illumination policies. | `combat/test/weather/night-twilight.test.ts` |
| AC-11 | **WeatherEventRecord completeness** — every weather transition/visibility result produces §28 fields: minute/substep, source/affected participants, canonical inputs, formulas/multipliers, RNG decisions, pre/post state hashes, version IDs, record hash. | `combat/test/weather/event-record.test.ts` |
| AC-12 | **Canonical ordering** — weather events order by §29: weather transitions by minute→component priority, then commands, then observation rays, then fire rays; DB/UI/rendering/wall-clock order must not affect outcomes; emitted via `BattleLedger`+`canonicalEventOrder`. | `combat/test/weather/ordering.test.ts`, `combat/test/weather/ledger-order.test.ts` |
| AC-13 | **Weather-in-minute-advance** — `resolveWeather` runs as a pure engine stage before spotting (step after battle init, before B-2 step 5) each minute; strict no-op when no weather components change (B-2/B-3/B-4 hashes unchanged); `BattleResolver`/`StrengthCalculator` UNMODIFIED (diff). | `combat/test/weather/advance.test.ts`, `combat/test/weather/integration-boundary.test.ts` |
| AC-14 | **Two-process determinism** — identical state+inputs produce identical per-minute hashes + weather events; two separate child processes (node-spawn ×2, byte-compared). | `combat/test/weather/determinism.test.ts` + cross-process child ×2 |
| AC-15 | **Contracts + validate guards** — every new weather/visibility constant ships `*_v1` + `SHIPPED_WEATHER_CONTRACT` + validate guard + `validateWeatherContract`; pinning fails closed. | `combat/test/weather/contracts.test.ts` |
| AC-16 | **Reason-code set-equality** — in-slice §30 weather codes exactly: `WEATHER_PROFILE_INCOMPLETE`, `INVALID_BATTLE_WEATHER_INITIALIZATION`, `WEATHER_VISIBILITY_FORMULA_MISSING`, `WEATHER_SMOKE_STATE_INVARIANT_FAILED`; plus reused existing combat codes; `reason-codes-weather.test.ts` prevents silent addition. | `combat/test/reason-codes-weather.test.ts` |
| AC-17 | **Goldens unchanged** — no snapshot schema/phase change that would invalidate goldens; `verify-golden-hashes.cjs` 9/9; `BattleResolver`/`StrengthCalculator` unmodified (diff). | orchestrator gate |

### 1.2 In scope

1. **StrategicWeatherState + weather phase + contracts/base** (INC-1):
   authoritative integer `StrategicWeatherState` (§1) + `assertFixedPointWeather`
   guards; new `weather_generation` monthly phase (order after `opening_validation`);
   base weather constant contracts seeded; weather reason-code seeds (ticket 05).

2. **BattleWeatherInitialization + components** (INC-2):
   `BattleWeatherInitialization` from strategic weather + battle context (§2);
   12-component `BattleWeatherComponents` (§3) as versioned integer fields +
   `weather_components_v1` constants.

3. **Tactical weather progression + visibility distance** (INC-3):
   30-minute progression engine with climate transition tables (§4);
   visibility distance formula with all multipliers + one FLOOR (§5);
   `weather_visibility_v1` constants (visibility, glare, fog, precipitation).

4. **Glare, fog, precipitation, night/twilight** (INC-4):
   Directional glare model (§24); fog/mist density→visibility (§25);
   precipitation type→visibility (§26); five-state night/twilight model (§27);
   `weather_environment_v1` constants.

5. **Weather-in-minute-advance + records + ordering** (INC-5):
   `resolveWeather` engine stage wired before spotting; `WeatherEventRecord`
   (§28) via `BattleLedger`; §29 canonical ordering; two-process determinism.

6. **Contracts rollup + reason-code set-equality + ADR** (INC-6):
   Full `weather_v1`, `weather_components_v1`, `weather_visibility_v1`,
   `weather_environment_v1` contracts with fail-closed proving tests;
   `reason-codes-weather.test.ts` set-equality vs §30; ADR-0022 (scope/
   integration boundary + reason-code policy).

### 1.3 Out of scope (deferred to M3/C-5)

- Smoke cloud §§7–23 (entire smoke subsystem: clouds, drift, decay, line
  intersection, funnel smoke, smokescreens, smoke floats, generators)
- Weather effects on torpedoes, submarines, aircraft, carrier operations
  (formulas owned by those subsystems)
- Phase-engine wiring replacing `BattleResolver` (B-6)
- Production-pack climate profile YAML (CONTENT-track)

### 1.4 Reason-code set-equality target

The weather reason-code set must exactly match the §30 weather subset:
- `WEATHER_PROFILE_INCOMPLETE`
- `INVALID_BATTLE_WEATHER_INITIALIZATION`
- `WEATHER_VISIBILITY_FORMULA_MISSING`
- `WEATHER_SMOKE_STATE_INVARIANT_FAILED`

Plus the three intentional **non-§30 in-slice markers** that ARE shipped
(required entry points per AC-1/AC-4 — construction-boundary and invariant-guard
codes, recorded in ADR-0022 §4):
- `INVALID_STRATEGIC_WEATHER_STATE` (strategic-state construction boundary, AC-1)
- `INVALID_TACTICAL_WEATHER_STATE` (tactical-components construction boundary, AC-4)
- `WEATHER_STATE_INVARIANT_FAILED` (generic invariant guard)

And reused existing codes from the shared `@bluewave/combat` reason-code catalog
(none reused this slice — weather owns its codes; the set-equality test proves
disjointness). Deferred codes (smoke codes, line-intersection codes) are recorded
in `map.md`'s "Not yet specified" but never shipped.

## 2. Implementation plan (INC slice frontier order)

| INC | Description | Depends on | ACs |
|-----|-------------|------------|-----|
| 1 | StrategicWeatherState + weather phase + reason-code seeds + base contracts | none | AC-1, AC-2 |
| 2 | BattleWeatherInitialization + weather components | INC-1 | AC-3, AC-4 |
| 3 | Tactical progression + visibility distance | INC-2 | AC-5, AC-6 |
| 4 | Glare, fog, precipitation, night/twilight | INC-3 | AC-7, AC-8, AC-9, AC-10 |
| 5 | Weather-in-minute-advance + records + ordering + determinism | INC-4 | AC-11, AC-12, AC-13, AC-14 |
| 6 | Contracts rollup + reason-code set-equality + ADR | INC-5 | AC-15, AC-16, AC-17 |