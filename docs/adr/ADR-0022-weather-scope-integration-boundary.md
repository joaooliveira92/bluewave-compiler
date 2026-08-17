# ADR-0022 (B-5): Weather / Visibility Scope & Integration Boundary + In-Slice Reason-Code & Constant Policy

## Status

Accepted 2026-08-15

## Context

B-5 is the fifth M2 sprint: the DESIGN-42 (`docs/rules/weather-visibility-and-smoke.md`)
**weather and visibility** subset (§§1–6, §24–30), folded into the B-2 minute-advance
engine (ADR-0018) as a new engine stage `resolveWeather` running before spotting.
DESIGN-42 is 529 lines; weather/visibility is about half; the smoke subsystem (§§7–23)
is deferred to M3/C-5 per DESIGN-55 §4.

B-2 delivered the minute-advance simulation and its integration/interference pattern
(ADR-0018), B-3 delivered `resolveGunnery` (ADR-0020), B-4 delivered `resolveDamage`
(ADR-0021). Each followed the same architecture: a pure engine stage called from
`advanceMinute` with optional context (absent → strict no-op, zero events → B-2
baseline hashes unchanged).

Two questions were open: (1) what exactly is the B-5 weather/visibility slice, and
(2) how are the weather reason codes, versioned constants, and the strategic weather
phase managed.

## Decision

1. **Scope = DESIGN-42 weather/visibility subset (engine-stage integration).**
   B-5 implements, as a pure deterministic engine in `@bluewave/combat`, DESIGN-42
   §§1–6 (strategic weather state, battle weather initialization, 12 tactical
   components, 30-min progression, visibility distance formula, weather effects)
   and §§24–30 (glare, fog/mist, precipitation, night/twilight, weather records,
   canonical ordering, reason codes). **Smoke §§7–23 is deferred to M3/C-5** and
   recorded in the spec.

   The engine runs as a new stage **`resolveWeather`** in the B-2 minute-advance
   simulation **between collisions (step 7) and spotting (step 8)** each minute,
   emitting through the existing `BattleLedger` + `canonicalEventOrder`. `BattleResolver`
   and `StrengthCalculator` remain unmodified. When no weather context is supplied,
   `resolveWeather` is a strict no-op: zero events appended, minute hashes
   byte-identical to the B-2/B-3/B-4 baseline.

2. **Phase registry update (strategic weather generation).** A new monthly phase
   `weather_generation` is registered in the `@bluewave/phase-engine` `PhaseRegistry`
   with order 0.5 (between `opening_validation` and `monthly_revenue`), with
   `rngAllowed: true`. The pure generation function `generateStrategicWeather` lives
   in `@bluewave/combat` (keyed stream `campaign/weather/<areaId>/<month>`). The
   campaign-snapshot wiring (climate profiles + weather state persistence) is **B-6**;
   until then, the phase engine executes weather_generation as a strict no-op with
   evidence, preserving goldens.

3. **Deferred subset recorded (M3/C-5, never silently dropped).** Smoke clouds,
   drift, decay, line intersection, funnel smoke, smokescreens, smoke floats,
   smoke generators (DESIGN-42 §§7–23) → M3/C-5. Weather effects on torpedoes,
   submarines, aircraft, carrier operations → owned by those subsystems'
   formula registries. The §30 smoke reason codes (INVALID_SMOKE_CLOUD,
   SMOKE_LINE_INTERSECTION_FAILED, etc.) are recorded as deferred, never shipped.

4. **In-slice reason-code policy (recorded, versioned).** The in-slice weather
   catalog ships exactly the §30 weather-only codes (`WEATHER_PROFILE_INCOMPLETE`,
   `INVALID_BATTLE_WEATHER_INITIALIZATION`, `WEATHER_VISIBILITY_FORMULA_MISSING`,
   `WEATHER_SMOKE_STATE_INVARIANT_FAILED`) plus three non-§30 in-slice markers:
   `INVALID_STRATEGIC_WEATHER_STATE` (strategic-state construction boundary),
   `INVALID_TACTICAL_WEATHER_STATE` (tactical components construction boundary),
   `WEATHER_STATE_INVARIANT_FAILED` (generic invariant guard). This is analogous
   to B-3's `GUNNERY_ELIGIBILITY_PREDICATE_DEFERRED` marker pattern. A
   `reason-codes-weather.test.ts` set-equality check against §30 + the marker list
   prevents silent addition. Deferred §30 smoke codes are recorded in the test
   but never shipped.

5. **Constant policy = `*_v1` validated contracts.** Four shipped contracts:
   `weather_v1` (strategic-state bounds/versions), `weather_components_v1`
   (12-component bounds + time-of-day states + local-variation policies),
   `weather_visibility_v1` (visibility exponent/rounding), `weather_environment_v1`
   (glare/fog/precipitation/night multipliers). Each has a `SHIPPED_*_CONTRACT` +
   `validate*Contract` guard (fail-closed on mismatch). A combined
   `validateAllWeatherContracts()` rollup proves all four simultaneously.

6. **Strategic-weather prior-state policy (recorded).** DESIGN-42 §1 requires
   generation "from canonical area climate, calendar month, and prior persistent
   state." DESIGN-42 defines no monthly persistence formula; B-5 records the prior
   state's state hash as `persistentWeatherStateId` (linkage only — no invented
   distributional persistence). A future sprint may define a versioned persistence
   function; B-5's explicit choice prevents silent drift.

7. **Local-variation policy (recorded).** DESIGN-42 §2 permits battle weather to
   differ from the strategic source only through a versioned keyed decision. B-5
   ships two policies: `weather_local_variation_none_v1` (strict copy — no random
   draws consumed) and `weather_local_variation_light_v1` (precipitation intensity,
   fog density, cloud cover each jittered by ±500 bp via the battle-seed-keyed
   stream). Sea state, wind, precipitation type, and base visibility are never
   jittered at initialization (committed until tactical progression).

8. **Progression no-table policy (recorded).** DESIGN-42 §4 states the engine MAY
   transition components only through the climate profile's declared transition
   table. When a table entry is absent for a component, the component stays
   unchanged — an explicit no-transition policy (not a `WEATHER_PROFILE_INCOMPLETE`).
   Draws are consumed ONLY when a table/drift entry exists for the component in
   that interval (fixed per-component order); an absent entry consumes nothing.
   The draws come from the **per-interval** keyed stream `battle/weather/interval/<n>`
   (n = interval index 1, 2, 3, ... derived from `floor(tacticalMinute / 30)`),
   rooted in the battle seed. Suffixing the interval index (M2) guarantees each
   interval draws its OWN sequence rather than replaying interval 1's draws at
   every boundary — required by §31.3 ("every 30 minutes through explicit tables
   and keyed decisions"). Earlier B-5 text and code claimed "6 draws always
   consumed"; this ADR supersedes that (the actual count varies 0..8 depending on
   which tables the season declares). The declared transition tables are validated
   at first use (and at strategic generation) — an undeclared band reference, a
   `reachableBandIds`/`weights` length mismatch, or a non-canonical precipitation
   key fails with `WEATHER_PROFILE_INCOMPLETE` (M3), never a silent no-op. A
   `seasonId` not declared in the climate profile is likewise a
   `WEATHER_PROFILE_INCOMPLETE` (never a silent no-op). Sea state is law-clamped
   to at most ±1 per interval (§4) REGARDLESS of the authored
   `seaStateDriftRange`; authoritative law beats the authored range (M4).

9. **Daylight-profile fail-closed (recorded).** `resolveTimeAndSolarGeometry`
   requires a well-formed daylight profile (non-empty, entries ascending from
   `minuteOfDay=0` to the 1440 wrap sentinel, canonical states, finite numeric
   fields). An absent or malformed profile fails with
   `WEATHER_PROFILE_INCOMPLETE` — there is NO silently invented "always DAY"
   profile (DESIGN-42 preamble: runtime inference and silent fallback are
   prohibited; M1). Each entry's solar geometry is canonical-angular too:
   bearing is an integer 0..359 and elevation an integer −90..90 at every
   entry. Earlier B-5 text allowed bearing `-1` as a "not applicable (night)"
   sentinel; that scheme contradicts the components surface
   (`SOLAR_BEARING_MIN_DEG = 0`), and with adjacent `-1` entries the resolver
   forwarded the sentinel into the first re-hash, failing with
   `WEATHER_STATE_INVARIANT_FAILED` instead of `WEATHER_PROFILE_INCOMPLETE`.
   The sentinel is removed: a profile entry outside 0..359 bearing (or outside
   −90..90 elevation) is malformed and fails with `WEATHER_PROFILE_INCOMPLETE`
   at resolution time — never the wrong invariant code at component
   construction.

10. **Tactical RNG-decision ledger (recorded, M6).** The strategic generation
    phase already records every keyed decision into a caller-provided
    `RandomLedger` (`campaign/weather/<areaId>/<month>`, phase
    `weather_generation`). This ADR extends the same port pattern to the two
    tactical weather consumers: battle-weather initialization records the
    local-variation jitter draws (`battle/weather/<battleId>/local_variation`,
    phase `battle_weather_initialization`) and the 30-minute progression records
    every per-interval draw (`battle/weather/interval/<n>`, phase
    `battle_weather_progression`). Both phases are canonical decision-phase ids
    recorded here (not strategic registry phases and not reason codes). When the
    caller supplies no ledger, draws are still consumed deterministically; they
    are simply not recorded into an external audit trail. Recording does not
    change any component outcome or hash.

11. **Minute-advance integration boundary (recorded).** The B-5 stage is a strict
    no-op *when no weather context is supplied* — zero events appended, minute
    hashes byte-identical to the pinned B-2/B-4 baseline (AC-13/AC-17; pinned
    literals in `advance.test.ts` and `integration-boundary.test.ts`). When a
    weather context IS supplied, `resolveWeather` emits a `weather_visibility`
    record every minute (§28: every visibility result creates a record), so the
    AC-13 phrase "no weather components change" is understood as the no-context
    path. Every record's `preStateHash`/`postStateHash` is the authoritative
    components hash AT THAT STAGE: after the TOD update, after progression, and
    at the visibility computation (H1) — never a stale pre-TOD hash. The
    per-minute glare multiplier uses the neutral `10_000` constant this slice:
    `glareIntensityBp` is always 0 at initialization and directional per-
    observation glare is owned by the INC-4 glare module during spotting (L6).

12. **`localeCompare` in `canonicalEventOrder` (recorded, L5).** The B-2-owned
    `canonicalEventOrder` sorts actor/target/event ids with `localeCompare` (B-2
    behavior, intentionally NOT refactored in B-5). The weather slice inherits
    it; its determinism is preserved because the same process/environment feeds
    the comparator. A future sprint may move the comparator to codepoint
    comparison; B-5 records the residual risk rather than touching the B-2
    function.

13. **Visibility BigInt boundary (recorded).** The §5 product `baseVisibilityUm ×
   10_000^5` can exceed `Number.MAX_SAFE_INTEGER` (~9e15). Bound analysis:
   `maxBaseVisibilityUm ≈ 1e11` × `10_000^5 = 10^20` → `10^31 < 2^128 ≈ 3e38`.
   This fits in native BigInt, which is authorized per ENGINEERING-CONTRACT
   "Introduce bigint only after documented bound analysis proves it necessary."

## Consequences

- B-5 adds engine capability without disturbing B-2/B-3/B-4: goldens stay 9/9,
  there is no snapshot schema change, and `BattleResolver`/`StrengthCalculator`
  are verifiably unmodified. The strict no-op path means minute-advance hashes
  for B-2/B-3/B-4 fixtures are byte-identical.
- Weather and visibility modifiers are now available for B-2 spotting and B-3
  gunnery consumers — the existing `neutral 10_000` constants in those subsystems
  are not yet replaced (that pin is a bridge to be swapped in a later sprint when
  weather integration is proven).
- 182 tests across the weather + weather-reason-code suites cover AC-1..AC-17
  (measured 2026-08-15 after the reviewer follow-up pass: +3 regression tests
  for the §9 bearing/elevation fail-closed, the negative-elevation NIGHT→NIGHT
  interpolation, and the progression-minute hash pin; includes the H1 hash-
  discipline, M1/M3 fail-closed, M2 per-interval stream, M4 sea-state law clamp,
  M5 initialization-boundary, M6 RNG-ledger, and L1 pinned-baseline tests).
- Four shipped contract families with full validate guards; 7 shipped reason codes;
  one new strategic phase registered.

## Related requirements

- DESIGN-42 §§1–6, §§24–30 (weather/visibility subset); DESIGN-38 (minute-advance +
  reasoning catalog); DESIGN-07 (integer arithmetic); DESIGN-55 §3–4 (M2 contents /
  M3 boundary).

## Related ADRs

- ADR-0018 (B-2 minute-advance integration), ADR-0020 (B-3 gunnery scope),
  ADR-0021 (B-4 armor/damage scope), ADR-0007 (cross-process determinism).