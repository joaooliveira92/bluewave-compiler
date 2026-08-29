# C-5 Implementation Report — Smoke + Detailed Damage Control

**Sprint:** C-5 (Track C — M3 Advanced Surface Warfare)
**Status:** COMPLETE — PASS
**Date:** 2026-08-29

## Summary

Implemented the full smoke module (DESIGN-42 §§7-23) and damage-control extension (DESIGN-41 §§13-22, §24-25, §27-28) as pure deterministic modules in `@bluewave/combat`. All 9 implementation tickets (INC-1..INC-9) completed with 15 acceptance criteria (AC-1..AC-15) passing.

## Modules delivered

**Smoke module** (`packages/combat/src/smoke/` — 14 source files):
- SmokeCloud model, constants, reason codes (16 codes), contracts
- Funnel smoke density computation (coal/mixed/oil/nuclear fuel profiles)
- Drift, decay, line intersection (wind bands, precipitation modifier, optical multiplier)
- Smokescreen eligibility/generation/cooldown/effects (DD/CL, 5-min gen, 20-min cooldown)
- Smoke floats (CL, 4 capacity, 8_500 density, ≤25kt)
- Smoke generators (3 charges, 9_000 density, 20-min cooldown)
- Source precedence (funnel + 1 deliberate; no simultaneous floats + generator)
- Smoke event records (8 record kinds, deterministic hashing)
- Engine wiring — `resolveSmoke` stage (step 5.5 after movement intent)

**Damage-control extension** (`packages/combat/src/damage/` — 6 new files):
- Fire resolution (per-minute progression, ROF penalty, night signature, fire smoke §25)
- Flooding resolution (severity, speed/stability effects, control, high-speed loss check)
- Damage-control resources and priority allocation (9-step priority)
- Engine wiring — `resolveDamageControl` stage (step 8.6 after damage)
- Extended reason codes (FIRE_SPREAD_CREATED, FLOODING_HIGH_SPEED_LOSS_CHECK, etc.)

**ADR:** ADR-0040 (scope/integration boundary + engine wiring + constants policy)

## Validation gate results

| Check | Result |
|-------|--------|
| Clean uncached build (`pnpm -w turbo run build --force`) | 18/18 successful |
| TypeScript (`tsc -b`) | Clean (no errors) |
| Format (`vp fmt .`) | Clean |
| Lint (`vp lint`) | 119 errors (all pre-existing: unused imports in test files across repo; 0 in new source files) |
| Combat test suite | 197 files / 2524 tests PASS |
| Phase-engine / campaign / AI test suites | 28 files / 274 tests PASS |
| Full engine test suites (excl. pre-existing failures) | 4113 tests PASS |
| Golden hashes (`scripts/verify-golden-hashes.cjs`) | 10/10 match golden reference |
| Two-process determinism | Byte-identical (smoke determinism tests PASS) |
| BattleResolver/StrengthCalculator | Unmodified (integration-boundary tests PASS) |
| Pre-existing unrelated failures | `content-schema/test/nation.test.ts` (broken import), `apps/desktop/` React test timeout, `.muse/worktrees/` stale worktrees |

## Acceptance criteria

| AC | Description | Status |
|----|-------------|--------|
| AC-1 | SmokeCloud model (§7) | PASS |
| AC-2 | Drift, decay, line intersection (§8-9) | PASS |
| AC-3 | Smokescreen lifecycle (§12-16) | PASS |
| AC-4 | Funnel smoke, floats, generators (§11, §17-22) | PASS |
| AC-5 | Source precedence (§23) | PASS |
| AC-6 | Fire propagation and resolution (§19-22, §24-25) | PASS |
| AC-7 | Flooding resolution (§13-18) | PASS |
| AC-8 | Damage-control resources and priority (§27-28) | PASS |
| AC-9 | Engine wiring (steps 5.5 + 8.6) | PASS |
| AC-10 | Records + canonical ordering (§28-29, §45-46) | PASS |
| AC-11 | Reason-code set-equality (§30, §47) | PASS |
| AC-12 | Contracts + validate guards | PASS |
| AC-13 | Two-process determinism | PASS |
| AC-14 | No snapshot/phase change | PASS |
| AC-15 | Integration boundary (BattleResolver/StrengthCalculator) | PASS |

## Deferred (recorded)

Per spec §1.6: full terminal state machine, survivors/rescue, aluminum superstructure, secondary hazards beyond fire/flooding, smoke→gunnery/spotting integration, YAML constants.

## Next sprint

**C-6 (M3 acceptance gate).** Sign M3 COMPLETED and update capability registry.