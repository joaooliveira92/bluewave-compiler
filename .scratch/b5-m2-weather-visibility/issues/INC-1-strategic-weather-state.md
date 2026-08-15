# INC-1: StrategicWeatherState + weather phase + reason-code seeds + base contracts

- **Status:** resolved
- **Blocked by:** none
- **ACs:** AC-1, AC-2

## Implementation

Create `StrategicWeatherState` (§1) with integer fields, `assertFixedPointWeather`
guards, base `weather_v1` constants contract seed. Add `weather_generation` phase
(order after `opening_validation`, before `command_collection`) generating per-area
`StrategicWeatherState` from climate profiles with keyed RNG stream
`campaign/weather/<areaId>/<month>`. Missing climate → `WEATHER_PROFILE_INCOMPLETE`.

## Files to create/modify

- `packages/combat/src/weather/` — new weather module directory
- `packages/combat/src/weather/strategic-state.ts` — `StrategicWeatherState` + guards
- `packages/combat/src/weather/constants.ts` — base weather constants + contract
- `packages/combat/test/weather/strategic-state.test.ts` — AC-1 proof
- `packages/combat/test/weather/strategic-generation.test.ts` — AC-2 proof
- Phase registry update in `packages/phase-engine/` for `weather_generation` phase