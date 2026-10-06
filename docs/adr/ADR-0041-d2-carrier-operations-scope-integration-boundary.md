# ADR-0041: D-2 Carrier Operations — Scope/Integration Boundary + Contracts Policy + Phase Wiring

## Status

Accepted (2026-08-29)

## Context

D-2 (Carrier Operations, DESIGN-44) is the second M4 (Aviation) sprint.  
INC-9 is the final ticket that wires the carrier operations engine into the
campaign pipeline as the `resolve_carrier_operations` phase (order 7.3) and
provides the contracts rollup, two-process determinism, and acceptance gate.

Several decisions taken across the D-2 implementation tickets need a recorded
rationale to constrain future scope, preserve determinism, and document the
reason-code/constants policy for the carrier-operations domain.

## Decisions

### 1. Phase integration boundary

`resolve_carrier_operations` sits at order 7.3 (after `resolve_aircraft_development`
at 7.2, before `battle_generation` at 7.5). At the strategic monthly level it:

- identifies carrier-capable ships (those with `compiledAircraftCapacity >= 4`
  or an existing `CarrierOperationsState` under `NationState.carrierOperations`);
- initializes a default `CarrierOperationsState` for any carrier that lacks one;
- performs no tactical minute-advance work (that is D-3's scope).

A nation with zero carriers produces zero state changes and zero records
(strict no-op — golden hashes for pre-carrier eras are unchanged).

### 2. `NationState.carrierOperations` field

Carrier operations state lives in a new optional field `carrierOperations` on
`NationState` (`Record<string, unknown>`, keyed by `shipId`). This follows the
pattern established by `aircraft` in D-1 and avoids a snapshot schema migration
for the campaign package.

### 3. Contracts policy

All 15 `*_v1` contracts are shipped in the D-2 sprint (INC-1..INC-8):
`SHIPPED_CARRIER_OPERATIONS_CONTRACT` + `validateAllCarrierOperationsContracts`
fail-closed guard. Every contract declares its literal shipped Zod schema;
`validateAllCarrierOperationsContracts` iterates the full entry list and throws
on any schema deviation. This follows the D-1/C-track pattern.

### 4. Reason-code policy

All 21 DESIGN-44 §31 reason codes are shipped in D-2. No deferred markers.
A set-equality guard (`.scratch/d2-m4-carrier-operations/issues/INC-8`) prevents
silent addition or removal. The reason-code surface is disjoint from all other
combat modules.

### 5. Two-process determinism

A dedicated `run-carrier-operations-child.ts` in `@bluewave/cross-process-test`
compiles a minimal carrier-having scenario, executes one month through the full
`MonthExecutor`, and outputs byte-identical hashes across two independent child
processes.

### 6. `BattleResolver`/`StrengthCalculator` untouched

D-2 touches no tactical combat resolution. An integration-boundary test proves
zero wiring into `BattleResolver` or `StrengthCalculator`.

## Consequences

- The new phase **regenerates golden hashes** (ADR-0007 process). The old hashes
  are captured at `golden/hashes.json` (pre-D-2) and replaced with the new ones
  after the first run that exercises the carrier-operations phase.
- Future carrier-operations scope (tactical CAP/strike in D-3, air defense in D-4)
  will extend the pipeline at the tactical minute-advance level, not at the
  strategic monthly phase.
- The `Record<string, unknown>` pattern means the campaign package has no
  compile-time dependency on `CarrierOperationsState` from `@bluewave/combat`.
  Type safety is provided by the `*_v1` Zod schemas at the combat boundary.

## Related

- ADR-0007 (golden hash regeneration process)
- ADR-0018 (B-2 scope/integration boundary)
- ADR-0020 (B-3 gunnery scope/integration boundary)
- ADR-0021 (B-4 armor/damage scope/integration boundary)
- ADR-0022 (B-5 weather scope/integration boundary)
- ADR-0031 (C-1 torpedoes scope/integration boundary)
- ADR-0033 (C-2 mine warfare scope/integration boundary)
- ADR-0039 (C-4 coastal defenses scope/integration boundary)
- ADR-0040 (C-5 smoke + damage control scope/integration boundary)