# INC-7: Records + ordering + reason codes + contracts

**Type:** implementation
**Status:** resolved
**ACs:** AC-17, AC-18, AC-19, AC-20
**Blocked by:** INC-1..INC-6
**Frontier:** yes

## Deliverable

`AirCombatRecord` type, canonical ordering per DESIGN-43 §39 + DESIGN-38 §29, full reason-code set (16 shipped + 3 deferred markers), `air_combat_v1` contract with 6-factor manifest + `validateAirCombatContract` guard. New file: `packages/combat/src/air-combat/records.ts`, `packages/combat/src/air-combat/reasonCodes.ts`, `packages/combat/src/air-combat/contracts.ts`, `packages/combat/src/air-combat/contractRollup.ts`.

## Acceptance criteria

- AC-17: `AirCombatRecord` per DESIGN-43 §38 — every engagement, loss, attack, state transition creates immutable record with record hash
- AC-18: ordering per DESIGN-43 §39 (§38 §29): battles → squadrons → engagements by minute+step+attacker+defender → losses by squadron+aircraft+timestamp
- AC-19: set-equality guard — 16 shipped, 3 deferred markers. All shipped codes reachable in scope
- AC-20: `air_combat_v1` contract with factor manifest, `validateAirCombatContract` fail-closed

## Reason codes

All 16 shipped + 3 deferred markers

## Test files

- `packages/combat/test/air-combat/records.test.ts`
- `packages/combat/test/air-combat/ordering.test.ts`
- `packages/combat/test/air-combat/reason-codes-rollup.test.ts`
- `packages/combat/test/air-combat/contracts.test.ts`