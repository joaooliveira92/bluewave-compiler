# Determinism ×2 + Contract Rollup + Golden Regeneration (ADR-0025/0007)

- **Type:** task
- **Status:** resolved
- **Blocked by:** INC-3

## Question

What is the determinism evidence, contract surface, and golden-regeneration
contract for the B-6 integration (spec AC-10, AC-12, AC-13)?

## Answer (resolved via INC-1/2/3 — components already shipped & gated)

1. Contracts `battle_auto_resolution_v1` + `SHIPPED_BATTLE_AUTO_RESOLUTION_V1` +
   `validateBattleAutoResolutionContract` → shipped in INC-2 (AC-13), fail-closed
   tests green.
2. In-slice reason codes → `battleResolution/reasonCodes.ts` + `reason-codes-
   battle-resolution.test.ts` set-equality guard (INC-2, green).
3. Two-process byte-identical → INC-2 `determinism.test.ts` (two clean child
   processes) + INC-3 phase-level two-run byte-identical closing
   snapshot/randomLedger + repo cross-process child byte-identical ×2 + goldens
   10/10. (AC-10)
4. Goldens ADR-0007 → regenerated in INC-1 (old→new documented);
   INC-2/INC-3 keep goldens 10/10 (no battle in the golden fixture). (AC-12)
5. `verify-golden-hashes.cjs` passes ×2. 
6. ADR-0025 (snapshot shape; INC-1) + ADR-0026 (INC-2 orchestrator) +
   ADR-0027 (INC-3 wiring) final. `BattleResolver`/`StrengthCalculator`
   diff-checked unmodified in every increment. `BattleResolver`/`StrengthCalculator` diff-checked unmodified.