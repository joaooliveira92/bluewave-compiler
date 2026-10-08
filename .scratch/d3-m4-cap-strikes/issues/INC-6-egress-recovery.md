# INC-6: Strike egress + fuel check + recovery integration

**ACs:** AC-14, AC-15
**Blocked by:** INC-5
**Frontier:** no

## Deliverable

Strike egress logic, fuel check (basic: insufficient fuel → ditch/loss), integration with D-2 recovery priority. New file: `packages/combat/src/air-combat/egress-recovery.ts`.

## Acceptance criteria

- AC-14: after attack, strike transitions EGRESSING→RETURNING. Fuel check: insufficient fuel → `AIR_COMBAT_STRIKE_FUEL_INSUFFICIENT`, aircraft loss
- AC-15: returning aircraft use D-2 recovery priority (§26). Deck state, wind, weather pass. Loss risk per D-2 §24 night/day

## Reason codes

- `AIR_COMBAT_STRIKE_FUEL_INSUFFICIENT`
- `AIR_COMBAT_RECOVERY_DECK_UNAVAILABLE`

## Test files

- `packages/combat/test/air-combat/egress.test.ts`
- `packages/combat/test/air-combat/recovery.test.ts`