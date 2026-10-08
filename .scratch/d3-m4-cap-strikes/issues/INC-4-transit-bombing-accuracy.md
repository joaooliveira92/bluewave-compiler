# INC-4: Transit time + bombing accuracy + dive/level bombing

**ACs:** AC-9, AC-10, AC-11
**Blocked by:** INC-3
**Frontier:** no

## Deliverable

Transit time formula, bombing accuracy formula (base + disruption), dive-bombing penetration. New file: `packages/combat/src/air-combat/bombing.ts`.

## Acceptance criteria

- AC-9: transit time to target = `ceil(distanceM / speedMps * 60)` considering formation speed (slowest aircraft)
- AC-10: base bombing accuracy = f(payload, altitude, visibility, target maneuver). Disruption reduces accuracy. Level bombing: baseline.
- AC-11: dive-bombing 8_500bp penetration multiplier relative to equal-mass level bomb. Does not change bomb explosive mass.

## Reason codes

- `AIR_COMBAT_BOMBING_PARAMETERS_INVALID`

## Test files

- `packages/combat/test/air-combat/transit-time.test.ts`
- `packages/combat/test/air-combat/bombing-accuracy.test.ts`
- `packages/combat/test/air-combat/dive-bombing.test.ts`