# INC-2: Smoke drift, decay, line intersection

**Frontier: yes** (blocked by INC-1)

## Acceptance criteria

AC-2, AC-3 (partial)

## Scope

Drift and decay (§8): `resolveSmokeDriftDecay` — per-minute translation by wind vector, wake displacement when still generating, expansion, density reduction by decay formula, merging compatible clouds, removal when density reaches 0. Wind retention multiplier bands (4 bands: <5kt 9_500, 5-<15kt 9_000, 15-<25kt 8_000, 25+kt 6_500). Precipitation decay modifier.

Line intersection (§9): `intersectLineSegmentWithSmoke` — checks authoritative line segment against all smoke cloud geometries, computes `pathDensityContribution`, `smokeOpticalMultiplierBp = max(1_000, 10_000 - floor(totalPathDensityBp * 8_000 / 10_000))`.

## Files to create

- `packages/combat/src/smoke/driftDecay.ts`
- `packages/combat/src/smoke/lineIntersection.ts`
- `packages/combat/test/smoke/drift-decay.test.ts`
- `packages/combat/test/smoke/line-intersection.test.ts`

## Verification

`pnpm vitest run packages/combat/test/smoke/drift-decay.test.ts packages/combat/test/smoke/line-intersection.test.ts` (at least 30 tests green)