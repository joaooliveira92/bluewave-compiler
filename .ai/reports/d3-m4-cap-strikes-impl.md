# D-3 Validation Report — CAP & Strikes (M4 Aviation)

**Sprint:** D-3-IMPL (INC-1..INC-8)
**Date:** 2026-08-29
**Commit:** `32d91ac`
**Governing docs:** DESIGN-43 §§22-31, DESIGN-44 §§13-18, DESIGN-38

## Result: PASS

All 22 ACs (AC-1..AC-22) satisfied. Full orchestrator validation gate passed.

### Validation evidence

| Command | Result |
|---------|--------|
| `pnpm -w turbo run build --force` | 18/18 tasks successful |
| `npx tsc -b` | Clean (no errors) |
| `pnpm -w turbo run test --filter=@bluewave/combat --force` | 242 files, 3237 tests PASS |
| `pnpm -w turbo run test --filter=@bluewave/cross-process-test --force` | 3 files, 17 tests PASS (incl. air-combat child) |
| `node scripts/verify-golden-hashes.cjs` | 10/10 matches golden reference |
| Two-process determinism (manual child run ×2) | Byte-identical hashes |

### Pre-existing unrelated failures (unchanged)
- `@bluewave/content-schema` — `nation.test.ts` broken import (documented)
- Some desktop tests (campaignBridge, ConstructionWizard)

### Deliverables

| INC | ACs | Delivered |
|-----|-----|-----------|
| INC-1 | AC-1, AC-2, AC-3 | CAP patrol state, detection, interception timing (34 tests) |
| INC-2 | AC-4, AC-5, AC-6 | 6-factor exchange formula, CAP vs escort/bomber (80 tests) |
| INC-3 | AC-7, AC-8 | Strike disruption, strike state machine (32 tests) |
| INC-4 | AC-9, AC-10, AC-11 | Transit time, bombing accuracy, dive bombing (29 tests) |
| INC-5 | AC-12, AC-13 | Air-launched torpedo, damage integration (40 tests) |
| INC-6 | AC-14, AC-15 | Egress, fuel check, recovery (25 tests) |
| INC-7 | AC-17, AC-18, AC-19, AC-20 | Records, ordering, reason codes (16+3), contracts (37 tests) |
| INC-8 | AC-16, AC-21, AC-22 | Engine stage wiring, cross-process child, integration proof (14 tests) |

### New files

**Source (15):** `packages/combat/src/air-combat/` — constants, reasonCodes, cap-patrol, exchange, cap-allocation, strike-state, bombing, torpedo-attack, damage, egress-recovery, engineWiring, records, ordering, contracts, contractRollup

**Test (19):** `packages/combat/test/air-combat/` — 19 test files, 245 tests total

**Cross-process:** `packages/cross-process-test/src/run-air-combat-child.ts`

### Modified files
- `packages/combat/src/index.ts` — barrel export
- `packages/combat/src/simulation/engine.ts` — stage wiring (step 7.7)
- `packages/cross-process-test/test/cross-process.test.ts` — air-combat tests

### Constraints verified
- `BattleResolver`/`StrengthCalculator` unmodified (git diff — zero changes)
- All functions pure/deterministic, SafeInt integers, BluewaveError for errors
- Strict no-op preserves prior golden hashes (10/10 unchanged)
- Full CAP/strike lifecycle integration with battle state deferred (documented in engineWiring.ts)

### Next
- **D-4 scoping** (Air defense / AA — DESIGN-45)