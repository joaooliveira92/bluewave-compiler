# INC-1: Smoke cloud model + constants + reason codes seed + contracts seed

**Frontier: yes** (no blockers)

## Acceptance criteria

AC-1 (partial), AC-6 (seed), AC-7 (seed), AC-9 (seed)

## Scope

SmokeCloud model (§7): `SmokeCloud` type with id, source type (FUNNEL/SMOKESCREEN/FLOAT/GENERATOR/FIRE), source id, owner, creation minute/substep, centroid position, density (1..10_000), drift vector, expansion rate, density-decay rate, fuel/composition, active status, hash. Source type discriminated union.

Funnel smoke profile (§11): fuel-type multipliers (coal 15_000, mixed 12_500, oil 7_500, nuclear 0), power-setting multipliers (5 bands), funnel smoke density formula.

Constants: `smoke_constants_v1` with drift/decay rates, retention multipliers (§8 wind bands), reference path length, optical multiplier constants (§9).

Reason codes seed: in-slice smoke codes + `SMOKE_RESOLUTION_DEFERRED` marker.

Contracts seed: `smoke_cloud_v1`, `funnel_smoke_profile_v1`, `smoke_constants_v1` + `validate*Contract` guards.

## Files to create

- `packages/combat/src/smoke/model.ts`
- `packages/combat/src/smoke/constants.ts`
- `packages/combat/src/smoke/reasonCodes.ts`
- `packages/combat/src/smoke/contracts.ts`
- `packages/combat/src/smoke/funnelSmoke.ts`
- `packages/combat/src/smoke/index.ts`
- `packages/combat/test/smoke/smoke-cloud.test.ts`
- `packages/combat/test/smoke/funnel-smoke.test.ts`

## Files to modify

- `packages/combat/src/reasonCodes.ts` — register smoke module

## Verification

`pnpm vitest run packages/combat/test/smoke/` (at least 30 tests green)