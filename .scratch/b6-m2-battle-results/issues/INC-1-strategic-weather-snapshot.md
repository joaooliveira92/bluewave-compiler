- **Type:** task
- **Status:** resolved
- **Blocked by:**

# INC-1: StrategicWeather snapshot + `weather_generation` wiring

## Acceptance criteria (spec AC-1, AC-2)

- `CampaignSnapshot` gains a canonically-ordered per-area current-month
  `strategicWeather` collection; serializer order stable; no unbounded growth.
- `weather_generation` (registry order 0.5) is authoritative: per-area states
  from default `climate_profile_v1` via keyed stream
  `campaign/weather/<areaId>/<month>`; missing profile →
  `WEATHER_PROFILE_INCOMPLETE`; `rngAllowed: true`; committed before
  `command_collection`.
- `cloneSnapshot` + `cross-process-test` child + persistence serialize the new
  field; save→load→replay round-trips; goldens regenerate under ADR-0007 with
  documented old/new + cause.
- ADR-0025 records the snapshot shape + default climate profile + compatibility
  bump/migration stance.

## Tests

`campaign/test/strategicWeather.test.ts`, `phase-engine/test/weather-generation.test.ts`,
`persistence` save/load/replay, cross-process ×2, `scripts/verify-golden-hashes.cjs`.
`BattleResolver`/`StrengthCalculator` unmodified (diff check).

## Changed-file intent

`@bluewave/campaign` (state), `@bluewave/combat` (climate profile default +
generateStrategicWeather export surface), `@bluewave/phase-engine` (month.ts +
registry wiring), `@bluewave/persistence` iff schema touches, cross-process child,
tests, `scripts/verify-golden-hashes.cjs` if key set changes, ADR-0025.