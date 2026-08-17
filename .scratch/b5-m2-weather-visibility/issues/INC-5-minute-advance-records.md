# INC-5: Weather-in-minute-advance + records + ordering + determinism

- **Status:** resolved
- **Blocked by:** INC-4
- **ACs:** AC-11, AC-12, AC-13, AC-14

## Implementation

Create `resolveWeather` engine stage wired before spotting in the minute-advance
simulation. `WeatherEventRecord` (§28) via `BattleLedger` + `canonicalEventOrder`.
§29 canonical ordering. Two-process determinism proof. Strict no-op when no
weather components change (B-2/B-3/B-4 hashes unchanged).

## Files to create/modify

- `packages/combat/src/weather/engine.ts` — `resolveWeather` engine stage
- `packages/combat/src/weather/event-record.ts` — `WeatherEventRecord`
- `packages/combat/src/weather/ordering.ts` — canonical ordering
- Integration into minute-advance engine (wiring after battle init, before spotting)
- `packages/combat/test/weather/advance.test.ts` — AC-13 proof
- `packages/combat/test/weather/ordering.test.ts` — AC-12 proof
- `packages/combat/test/weather/ledger-order.test.ts` — AC-12 ordering proof
- `packages/combat/test/weather/event-record.test.ts` — AC-11 proof
- `packages/combat/test/weather/determinism.test.ts` — AC-14 proof + cross-process child ×2