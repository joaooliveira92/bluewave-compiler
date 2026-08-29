# INC-8: Engine wiring, records, ordering, two-process determinism

**Frontier: yes** (blocked by INC-2, INC-5, INC-6, INC-7)

## Acceptance criteria

AC-3, AC-8, AC-10

## Scope

Engine wiring: add `resolveSmoke` stage to minute-advance engine (step 5.5, after weather step 7.5, before spotting step 8) — drift/decay, line intersection affects spotting. Add `resolveDamageControl` stage (step 8.6, after `resolveDamage` at 8.5) — fire resolution, flooding resolution, damage-control allocation, performance recomputation, terminal state re-evaluation. Strict no-op when no smoke/fire/flooding sources present (existing B-2/B-3/B-4 hashes unchanged for pre-smoke battles).

Smoke event records (§28): immutable `SmokeEventRecord` for every drift/decay, intersection, funnel-smoke emission, smokescreen generation step, float deployment, generator activation.

Damage-control event records (§45 extension): per-minute fire propagation records, flooding resolution records, damage-control allocation records.

Canonical ordering (§29 smoke + §46 damage-control): smoke by minute/substep → source type → source id → cloud creation time → cloud id. Damage-control by minute/substep → fire source id → flooding source id → resource allocation priority.

Two-process determinism child: `run-smoke-damage-child.ts` — spawn two child processes with identical inputs, compare per-minute hashes byte-identical.

## Files to create

- `packages/combat/src/smoke/smokeRecords.ts`
- `packages/combat/src/smoke/engineWiring.ts`
- `packages/combat/src/damage/damageControlEngineWiring.ts` (or extend existing `engineWiring.ts`)
- `packages/combat/test/smoke/smoke-records.test.ts`
- `packages/combat/test/damage/damage-control-records.test.ts`
- `packages/combat/test/smoke/determinism.test.ts` (+ cross-process child)
- `scripts/run-smoke-damage-child.ts`

## Files to modify

- `packages/combat/src/simulation/engine.ts` — add resolveSmoke + resolveDamageControl stages
- `packages/combat/src/simulation/engine.test.ts`

## Verification

Two-process child byte-identical. Goldens regenerated per ADR-0007.