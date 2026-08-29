# INC-5: Air-launched torpedo attack + damage integration

**ACs:** AC-12, AC-13
**Blocked by:** INC-4
**Frontier:** no

## Deliverable

Air-launched torpedo attack reusing C-1 hit resolution with air-launch overrides. Lightweight `AirAttackDamagePackage` that feeds into existing `resolveDamage`. New file: `packages/combat/src/air-combat/torpedo-attack.ts` and `packages/combat/src/air-combat/damage.ts`.

## Acceptance criteria

- AC-12: air-launched torpedo uses C-1 `resolveTorpedoHit` with drop-speed ≥ threshold, drop-altitude range, min run distance. Air-launch has higher closing speed → hit bonus
- AC-13: bomb/torpedo hits create `AirAttackDamagePackage` feeding into `resolveDamage`. Bomb penetration uses existing armor model. No duplicate resolver

## Reason codes

- `AIR_COMBAT_TORPEDO_ATTACK_INELIGIBLE`
- `AIR_COMBAT_ATTACK_NO_DAMAGE`

## Test files

- `packages/combat/test/air-combat/torpedo-attack.test.ts`
- `packages/combat/test/air-combat/damage-integration.test.ts`