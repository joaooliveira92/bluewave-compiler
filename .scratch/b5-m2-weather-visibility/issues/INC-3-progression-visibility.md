# INC-3: Tactical weather progression + visibility distance

- **Status:** resolved
- **Blocked by:** INC-2
- **ACs:** AC-5, AC-6

## Implementation

Create 30-minute tactical weather progression engine with climate transition
tables (§4). Sea state ±1 per interval. Wind direction per climate band.
Visibility distance formula (§5): exact integer product with one FLOOR.
`weather_visibility_v1` constants. Missing factor → `WEATHER_VISIBILITY_FORMULA_MISSING`.

## Files to create/modify

- `packages/combat/src/weather/progression.ts` — weather progression engine
- `packages/combat/src/weather/visibility.ts` — visibility distance formula
- `packages/combat/src/weather/constants.ts` — add visibility constants
- `packages/combat/test/weather/progression.test.ts` — AC-5 proof
- `packages/combat/test/weather/visibility.test.ts` — AC-6 proof