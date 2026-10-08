# INC-5: Fire propagation and state resolution

**Frontier: yes** (blocked by B-4 pipeline existing, INC-1 smoke model for §25 coupling)

## Acceptance criteria

AC-4, AC-5 (partial)

## Scope

Fire state (§19): `FireSource` type with identifier, compartment/zone, intensity (1..10_000), fuel class, oxygen/ventilation, spread contacts, suppression allocation, electrical/pumping deps, smoke production, night-visibility signature, start/last-resolution time, hash.

Fire-risk multipliers by ship type (§20): ordinary 10_000, carrier 15_000, transport 13_000, AMC 12_500, AV 13_000, pre-dreadnought 12_000, submarine explicit, other 10_000. Highest single multiplier.

Fire damage to superstructure (§21): component evaluation order (9 items), fire does not damage outside spread contacts.

Fire rate-of-fire penalty (§22): 4-band intensity multipliers (1-2_499: 9_500, 2_500-4_999: 8_500, 5_000-7_499: 7_000, 7_500-10_000: 5_000).

Fire night visibility (§24): 5-band signature multipliers.

Fire smoke (§25): `smokeStrength = floor(fireIntensity * smokeFuelMultiplierBp * ventilationMultiplierBp / 10_000^2)`. Created smoke enters the smoke module as a source. Coupling boundary: fire smoke writes a `SmokeSourceRecord` for INC-2's drift/decay.

## Files to create

- `packages/combat/src/damage/fireResolution.ts`
- `packages/combat/src/damage/fireConstants.ts`
- `packages/combat/test/damage/fire-resolution.test.ts`
- `packages/combat/test/damage/fire-constants.test.ts`

## Files to modify

- `packages/combat/src/damage/reasonCodes.ts` — add FIRE codes (extend existing FIRE_SOURCE_CREATED)

## Verification

`pnpm vitest run packages/combat/test/damage/fire-resolution.test.ts`