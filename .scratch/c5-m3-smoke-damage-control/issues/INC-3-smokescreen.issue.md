# INC-3: Smokescreen eligibility, generation, cooldown, tactical effects

**Frontier: yes** (blocked by INC-1, INC-2)

## Acceptance criteria

AC-2 (partial), AC-3 (partial)

## Scope

Smokescreen eligibility (§12): `isShipEligibleForSmokescreen` — DD or CL, equipment installed/operational, consumable available, ACTIVE readiness, OPERATIONAL/DEGRADED damage, ≥5kt speed, no cooldown, command authority, mission permits.

Generation (§13): 5-minute generation, connected smoke segments along movement path, early end conditions.

Cooldown (§14): 20 minutes from first emission, second command eligible at `firstGenerationTime + 20`.

Density and width (§15): initial density 9_000 bp, reference width 500m, vertical extent 100m, segment lifetime via §8 decay.

Tactical effects (§16): optical spotting/identification penalty, gunnery accuracy reduction, fall-of-shot interruption, torpedo track obscuration, friendly unit obscuration, formation/complication.

## Files to create

- `packages/combat/src/smoke/smokescreen.ts`
- `packages/combat/test/smoke/smokescreen.test.ts`

## Verification

`pnpm vitest run packages/combat/test/smoke/smokescreen.test.ts` (at least 30 tests green)