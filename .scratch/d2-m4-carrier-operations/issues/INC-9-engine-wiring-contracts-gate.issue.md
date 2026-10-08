**Type:** implementation
**Status:** open
**Blocked by:** INC-1, INC-2, INC-3, INC-4, INC-5, INC-6, INC-7, INC-8
**Frontier:** yes

# INC-9: Engine wiring + contracts rollup + two-process + gate

## Deliverable

- `resolve_carrier_operations` phase stage (order 7.3, rngAllowed: true) in `@bluewave/phase-engine/src/registry.ts`
- `resolveCarrierOperations` per-nation function: iterate carrier-capable ships, advance carrier operations state, process ongoing deck cycles, handle strategic-month carrier ops
- Integration-boundary test: zero carrier-capable ships = strict no-op, goldens/B-2/B-3/B-4/B-5/B-6 hashes unchanged
- Contracts rollup: all 15 `*_v1` contracts → `SHIPPED_CARRIER_OPERATIONS_CONTRACT` + `validateAllCarrierOperationsContracts` fail-closed guard
- Two-process determinism child: `run-carrier-operations-child.ts` (following `run-aircraft-child.ts` pattern)
- ADR for D-2 scope/integration boundary + constants policy + contract design
- Goldens regenerate under ADR-0007 — document old/new hashes
- `BattleResolver`/`StrengthCalculator` unmodified verification
- Updated phase registry in `docs/PROGRESS.md`

## Acceptance criteria

AC-34 (phase wiring), AC-35 (contracts), AC-36 (two-process), AC-37 (BattleResolver unmodified).