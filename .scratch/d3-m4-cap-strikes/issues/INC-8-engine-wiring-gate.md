# INC-8: Engine wiring + two-process determinism + acceptance gate

**ACs:** AC-16, AC-21, AC-22
**Blocked by:** INC-1..INC-7
**Frontier:** no

## Deliverable

Engine wiring of `resolveAirCombat` stage (step 1, substep 1) in the minute-advance pipeline. Two-process determinism child process. Integration-boundary proof. ADR for scope/integration boundary. Final orchestrator gate.

## Acceptance criteria

- AC-16: new `resolveAirCombat` stage (substep 1, after weather, before gunnery substep 2). Strict no-op when no CAP/strike aircraft → preserves prior goldens
- AC-21: two-process determinism — child process `run-air-combat-child.ts`, byte-compared across 2 runs
- AC-22: `BattleResolver`/`StrengthCalculator` unmodified — verified by diff + integration-boundary test

## ADR

ADR for scope/integration boundary (following ADR-0020, ADR-0031 pattern). Document stage position, no-op guarantee, and deferred items (AA, experience, fuel).

## Test files

- `packages/cross-process-test/test/cross-process.test.ts` (add air-combat child)
- `packages/cross-process-test/run-air-combat-child.ts`
- `packages/combat/test/air-combat/integration.test.ts`