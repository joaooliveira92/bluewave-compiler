# Determinism ×2 + Contract Rollup + Golden Regeneration (ADR-0025/0007)

- **Type:** task
- **Status:** ready-for-agent
- **Blocked by:** INC-3

## Question

What is the determinism evidence, contract surface, and golden-regeneration
contract for the B-6 integration (spec AC-10, AC-12, AC-13)?

## Answer

1. `battle_auto_resolution_v1` + default `climate_profile_v1` contracts ship with
   `SHIPPED_*` + validate guard; pinning fails closed.
2. In-slice reason codes appended to `@bluewave/combat` catalog; a
   `reason-codes-battle-resolution.test.ts` set-equality guard prevents silent
   addition (mirrors the weather/gunnery pattern).
3. Two-process byte-identical cross-process run incl. new battle-result keys.
4. Goldens regenerated per ADR-0007: old value → new value + authoritative cause
   (snapshot gains weather; battle_resolution now tactical) + version impact +
   migration assessment, documented in the B-6 impl report.
5. `scripts/verify-golden-hashes.cjs` prints "All N hashes match golden reference"
   twice across distinct runs.
6. ADR-0025 final (INC-1 snapshot shape already recorded in ADR-0025; INC-4's
   scope/integration boundary + consequence rule appended to that ADR or a
   follow-up ADR if material). `BattleResolver`/`StrengthCalculator` diff-checked unmodified.