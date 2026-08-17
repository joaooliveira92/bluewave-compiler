# Wayfinder Map: M2 Tactical Weather & Visibility (B-5)

## Destination

Scope and implement the **weather and visibility** subset of DESIGN-42
(`docs/rules/weather-visibility-and-smoke.md`) as an engine-only, deterministic,
minute-advancing **tactical weather model** in `@bluewave/combat`, producing
battle-time weather state, visibility distance, and weather-effect modifiers
consumed by B-2 spotting and B-3 gunnery. Integration into the phase pipeline
is B-6 (same boundary rule as B-2/B-3/B-4). **No** campaign snapshot schema
change; golden hashes must remain unchanged (no ADR-0007 regeneration) unless
an authoritative cause is documented.

This chart follows the B-2/B-3/B-4 pattern exactly. DESIGN-42 is 529 lines; B-5
scopes only the **weather/visibility** subset (§§1–6, §24–30). **Smoke** (§§7–23)
is deferred to M3 per DESIGN-55 §4.

## Notes

- Domain: `@bluewave/combat` (pure, platform-independent, deterministic). Builds
  on B-1 (battle generation / tactical units) + B-2 (minute-advance engine,
  `BattleLedger`, `canonicalEventOrder`, reason-code catalog, `TacticalContact`
  tracks) + B-3 (`resolveGunnery`) + B-4 (`resolveDamage`). `BattleResolver`/
  `StrengthCalculator` remain unmodified.
- Skills: `/grilling` + `/domain-modeling` for scope; `/research` for climate
  and visibility grounding; `/to-tickets` for slicing.
- ADR required: the B-5 scope/integration boundary (mirrors ADR-0018 for B-2)
  and any genuinely new reason codes / constant policies.
- The weather model is consumed by spotting (B-2) and gunnery (B-3) through
  explicit modifier factors — those formulas exist as neutral-10_000 constants
  today and will swap to real weather data as B-5 wires them.

## Decisions so far

- [Scope Boundary](issues/01-scope-boundary.md) — **resolved.** B-5 ships the
  **weather and visibility** subset of DESIGN-42: strategic weather state (§1),
  battle weather initialization (§2), weather components (§3), tactical weather
  progression (§4), visibility distance (§5), weather effects (§6), glare (§24),
  fog/mist (§25), precipitation (§26), night/twilight (§27), weather records
  (§28), canonical ordering (§29), and weather reason codes (§30).
  **Deferred (M3/C-5):** all smoke (§§7–23), weather effects on torpedoes/
  submarines/air (owned by those subsystems' formula registries).
- [Integration Boundary](issues/02-integration-boundary.md) — **resolved.**
  Weather runs as a pure **engine-stage** inside the minute-advance simulation:
  `resolveWeather` executes before spotting (step after B-1 battle init,
  before B-2 spotting step 5), producing `WeatherEventRecord`s via the existing
  `BattleLedger`+`canonicalEventOrder`. No phase-engine change (phase wiring is
  B-6), no snapshot change, goldens unchanged.
- [Strategic Weather Generation](issues/03-strategic-weather-generation.md) —
  **resolved.** `StrategicWeatherState` is generated during the monthly weather
  phase (new phase `weather_generation`, order TBD between `opening_validation`
  and `battle_resolution`) from canonical area climate profiles. Keyed RNG stream
  `campaign/weather/<areaId>/<month>`. Missing climate → `WEATHER_PROFILE_INCOMPLETE`.
- [Weather Components & Visibility](issues/04-weather-components-visibility.md) —
  **resolved.** All 12 tactical weather components (§3) as versioned integer
  fields. Visibility formula (§5) as exact basis-point product, one FLOOR,
  `clamp(0,10_000,*)`. Glare angular bands (§24), fog bands (§25), precipitation
  bands (§26), night/twilight states (§27). All shipped as `*_v1` constants with
  validate guards.
- [Weather Progression & Records](issues/05-weather-progression.md) — **resolved.**
  Tactical weather progression at exactly 30-min intervals via climate profile
  transition tables. Sea state ±1 per interval. Wind direction per climate band.
  Full `WeatherEventRecord` (§28) + canonical ordering (§29) via
  `BattleLedger`+`canonicalEventOrder` + two-process determinism proof.

## Not yet specified (later INC slices / follow-up tickets)

- **In-slice (this sprint)**: weather's effect on spotting (B-2 radar/visibility
  factor pin currently neutral 10_000, will swap to real weather visibility data
  through an authored constant bridge). Detailed damage-control weather effects
  (M3). Climate profile YAML for production pack (CONTENT-track, later sprint).

## Out of scope for B-5

- Phase-engine wiring replacing `BattleResolver` (B-6), auto-resolution
  statistical validation (B-6/release), player battle UI, production-pack YAML
  climate profiles (CONTENT-track), smoke §§7–23 (M3/C-5), weather effects on
  torpedoes/submarines/air (owned by those subsystems).