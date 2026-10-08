# INC-1: Coastal battery definitions, land target types, damage states, constants, reason codes seed

**Frontier: yes** (no blockers)

## Acceptance criteria

AC-1, AC-2 (partial), AC-3 (partial), AC-8 (seed), AC-9 (seed)

## Files to create

- `packages/combat/src/coastal-defense/model.ts` — `CoastalBatteryDefinition`, `LandTargetType` (7-value discriminated union), `LandTargetDamageState` (5-value enum), damage event type (`BOMBARDMENT`/`SHELLING`/`ASSAULT`)
- `packages/combat/src/coastal-defense/constants.ts` — `coastal_defense_constants_v1`, `land_target_damage_states_v1`, `coastal_battery_era_bands_v1`
- `packages/combat/src/coastal-defense/reasonCodes.ts` — in-slice codes (6 shipped + 1 marker)
- `packages/combat/src/coastal-defense/contracts.ts` — `*_v1` contracts + `validate*Contract` guards
- `packages/combat/src/coastal-defense/index.ts` — barrel export
- `packages/combat/test/coastal-defense/battery-definition.test.ts`
- `packages/combat/test/coastal-defense/land-target-types.test.ts`
- `packages/combat/test/coastal-defense/contracts.test.ts` (seed)

## Files to modify

- `packages/combat/src/reasonCodes.ts` — register coastal-defense codes in the module index (following C-3 pattern: a marker export only; the full partition is per-module)

## Verification

`pnpm vitest run packages/combat/test/coastal-defense/` (at least 30 tests green)