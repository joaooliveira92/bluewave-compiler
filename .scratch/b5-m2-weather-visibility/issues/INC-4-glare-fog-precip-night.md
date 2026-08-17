# INC-4: Glare, fog, precipitation, night/twilight

- **Status:** resolved
- **Blocked by:** INC-3
- **ACs:** AC-7, AC-8, AC-9, AC-10

## Implementation

Create directional glare model (§24): angular separation bands, cloud cover
disable. Fog/mist density→visibility multiplier (§25). Precipitation type→
visibility multiplier (§26). Five-state night/twilight model (§27) from battle
date/location/tactical time/daylight profile. `weather_environment_v1` constants.

## Files to create/modify

- `packages/combat/src/weather/glare.ts` — glare model
- `packages/combat/src/weather/fog.ts` — fog/mist model
- `packages/combat/src/weather/precipitation.ts` — precipitation model
- `packages/combat/src/weather/night-twilight.ts` — night/twilight model
- `packages/combat/src/weather/constants.ts` — add environment constants
- `packages/combat/test/weather/glare.test.ts` — AC-7 proof
- `packages/combat/test/weather/fog.test.ts` — AC-8 proof
- `packages/combat/test/weather/precipitation.test.ts` — AC-9 proof
- `packages/combat/test/weather/night-twilight.test.ts` — AC-10 proof