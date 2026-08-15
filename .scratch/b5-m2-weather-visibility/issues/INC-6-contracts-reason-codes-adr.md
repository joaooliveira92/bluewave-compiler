# INC-6: Contracts rollup + reason-code set-equality + ADR

- **Status:** resolved
- **Blocked by:** INC-5
- **ACs:** AC-15, AC-16, AC-17

## Implementation

Full `weather_v1`, `weather_components_v1`, `weather_visibility_v1`,
`weather_environment_v1` contracts with fail-closed proving tests.
`reason-codes-weather.test.ts` set-equality vs §30 weather-only codes.
ADR-0022 (scope/integration boundary + reason-code policy + constant policy).
Golden verify unchanged.

## Files to create/modify

- `packages/combat/test/weather/contracts.test.ts` — AC-15 proof
- `packages/combat/test/reason-codes-weather.test.ts` — AC-16 proof
- `docs/adr/ADR-0022-weather-scope-integration-boundary.md` — ADR
- Orchestrator gate: `verify-golden-hashes.cjs` 9/9, `tsc -b`, lint, full suite