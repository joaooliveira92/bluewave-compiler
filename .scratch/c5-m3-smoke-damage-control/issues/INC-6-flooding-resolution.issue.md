# INC-6: Flooding state and control

**Frontier: yes** (blocked by B-4 pipeline existing)

## Acceptance criteria

AC-4 (partial), AC-5 (partial)

## Scope

Flooding state (§13): `FloodingSource` type with id, compartment, breach type, ingress rate, sea-pressure multiplier, speed-pressure multiplier, progressive-failure multiplier, containment/isolation, pumping allocation, repair allocation, start time, last resolution, hash.

Flooding severity (§14): MINOR (<500bp), SERIOUS (500-1_499), MAJOR (1_500-2_999), CRITICAL (≥3_000). Recalculated each update.

Speed and stability effects (§15): max-speed multipliers (9_500/8_000/6_000/3_500), stability multipliers (9_500/8_500/7_000/5_000).

Control speed threshold (§16): 10 knots (5_144_440 µm/s). Speed-pressure multipliers (6 bands: ≤10kt 7_500, 10-≤15kt 10_000, 15-≤20kt 12_500, 20-≤25kt 15_000, >25kt 20_000).

High-speed loss risk (§17): MAJOR/CRITICAL >20kt triggers per-minute check. Base probability (major 20-25: 500, major >25: 1_500, critical 20-25: 2_000, critical >25: 5_000). Stream `battle/ship/flooding/high_speed_loss`.

Flooding control (§18): `netFloodingDelta = max(0, floor(totalIngress * speedPressureBp * progressiveFailureBp / 10_000^2) - effectivePumping - effectiveRepairReduction)`. Dewatering rate when pumping exceeds ingress.

## Files to create

- `packages/combat/src/damage/floodingResolution.ts`
- `packages/combat/src/damage/floodingConstants.ts`
- `packages/combat/test/damage/flooding-resolution.test.ts`
- `packages/combat/test/damage/flooding-constants.test.ts`

## Files to modify

- `packages/combat/src/damage/reasonCodes.ts` — add FLOODING codes (extend FLOODING_SOURCE_CREATED, add FLOODING_HIGH_SPEED_LOSS_CHECK)

## Verification

`pnpm vitest run packages/combat/test/damage/flooding-resolution.test.ts`