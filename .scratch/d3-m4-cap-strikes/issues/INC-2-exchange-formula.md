# INC-2: Air-to-air exchange formula + CAP vs escort/CAP vs bomber

**ACs:** AC-4, AC-5, AC-6
**Blocked by:** INC-1
**Frontier:** no

## Deliverable

6-factor squadron-quality exchange formula (quality, numericalAdvantage, altitude, surprise, defenderSurvival, escort). CAP allocation proportionally vs escort and bombers. New file: `packages/combat/src/air-combat/exchange.ts`.

## Acceptance criteria

- AC-4: CAP allocated proportionally: `capToEscortBp = floor(escortCount * 10_000 / max(1, escortCount + capCount))`
- AC-5: 6-factor formula. Integer bp, floor-once, keyed RNG. `killProbabilityBp = floor(PI(factorBp) / 10_000^6)`. Losses = `floor(killProb * defenderCount / 10_000)`
- AC-6: remaining CAP (after escort) engages bombers. Bombers do NOT return fire

## Reason codes

- `AIR_COMBAT_QUALITY_OUT_OF_RANGE`
- `AIR_COMBAT_ATTACKER_ZERO_STRENGTH`
- `AIR_COMBAT_NO_AVAILABLE_TARGET`
- `AIR_COMBAT_ESCORT_ZERO_STRENGTH`
- `AIR_COMBAT_STRIKE_ZERO_STRENGTH`

## Test files

- `packages/combat/test/air-combat/cap-vs-escort.test.ts`
- `packages/combat/test/air-combat/exchange-formula.test.ts`
- `packages/combat/test/air-combat/cap-vs-bomber.test.ts`