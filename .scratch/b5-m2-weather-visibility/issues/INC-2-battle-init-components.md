# INC-2: BattleWeatherInitialization + weather components

- **Status:** resolved
- **Blocked by:** INC-1
- **ACs:** AC-3, AC-4

## Implementation

Create `BattleWeatherInitialization` from strategic weather + battle context (§2).
Create 12-component `BattleWeatherComponents` (§3) as versioned integer fields
with `weather_components_v1` constants + `SHIPPED_WEATHER_COMPONENTS_CONTRACT`.
Non-integers rejected (`INVALID_TACTICAL_WEATHER_STATE`).

## Files to create/modify

- `packages/combat/src/weather/battle-init.ts` — `BattleWeatherInitialization`
- `packages/combat/src/weather/components.ts` — `BattleWeatherComponents`
- `packages/combat/src/weather/constants.ts` — add component constants
- `packages/combat/test/weather/battle-init.test.ts` — AC-3 proof
- `packages/combat/test/weather/components.test.ts` — AC-4 proof