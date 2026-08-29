# INC-7: Damage-control resources and priority

**Frontier: yes** (blocked by INC-5, INC-6)

## Acceptance criteria

AC-4 (partial), AC-5 (partial)

## Scope

Damage-control resources (§27): teams, pumping capacity, firefighting capacity, emergency electrical power, available crew, specialists, repair materials, compartment access, player/AI priorities. No double-allocation.

Damage-control priority (§28): 9-step priority list (1: magazine/torpedo/aviation-fuel/reactor; 2: critical flooding; 3: uncontrolled major fire; 4: steering/propulsion; 5: electrical power; 6: fire-control/communications; 7: weapon restoration; 8: non-critical dewatering; 9: cosmetic). Equal-priority: severity descending, source id ascending.

`allocateDamageControl` function: given available resources and active fire/flooding sources, produce allocation by priority order.

## Files to create

- `packages/combat/src/damage/damageControl.ts`
- `packages/combat/src/damage/damageControlConstants.ts`
- `packages/combat/test/damage/damage-control.test.ts`

## Verification

`pnpm vitest run packages/combat/test/damage/damage-control.test.ts`