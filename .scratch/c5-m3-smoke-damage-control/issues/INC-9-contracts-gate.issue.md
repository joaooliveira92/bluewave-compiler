# INC-9: Contracts rollup, reason-code set-equality, ADR, traceability, gate

**Frontier: yes** (blocked by INC-8)

## Acceptance criteria

AC-6, AC-7, AC-8, AC-9, AC-10, AC-11

## Scope

Full `*_v1` contracts rollup: `validateAllSmokeContracts` + `validateAllDamageControlContracts` fail-closed guards.

Reason-code set-equality: `reason-codes-smoke.test.ts` + `reason-codes-damage-control.test.ts` comparing in-slice codes vs DESIGN-42 §30 + DESIGN-41 §47. Deferred codes recorded, never shipped. Retired code marker prevents re-addition. Disjointness proof across all combat reason codes.

ADR-0040: scope/integration boundary + smoke-stage wiring decision (option B from 03-phase-integration-boundary) + damage-control pipeline extension (option A from 05-damage-control-pipeline) + reason-code/constant policy. Document goldens regeneration under ADR-0007.

Integration-boundary proof: `integration-boundary.test.ts` proves `BattleResolver`/`StrengthCalculator` unmodified, no phase-engine registration, no snapshot change.

Golden hashes: regenerate per ADR-0007, document old/new hashes + authoritative cause (smoke stage wires into minute-advance, changing per-minute hashes).

Traceability: update PROGRESS.md, SPRINT-PLAN.md, create `.ai/reports/c5-m3-smoke-damage-control-impl.md`.

## Files to create

- `packages/combat/src/smoke/contractRollup.ts`
- `packages/combat/src/damage/contractRollup.ts` (or extend existing)
- `packages/combat/test/smoke/reason-codes-smoke.test.ts`
- `packages/combat/test/damage/reason-codes-damage-control.test.ts`
- `packages/combat/test/smoke/integration-boundary.test.ts`
- `packages/combat/test/damage/damage-control-integration-boundary.test.ts`
- `docs/adr/ADR-0040-smoke-damage-control-scope-and-integration.md`

## Verification

Full orchestrator validation gate: `pnpm -w turbo run build --force`, `tsc -b`, `pnpm lint` (pre-existing failures only), `pnpm format`, full test suite, golden verify, two-process determinism. Report at `.ai/reports/c5-m3-smoke-damage-control-impl.md`.