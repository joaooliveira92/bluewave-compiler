# 31: Yard fit and choice in the Drawing Board

**Type:** implementation
**Status:** resolved
**Blocked by:** none
**Frontier:** yes

Spec: `parity-spec.md` F1. Show `forecast.yardId`, per-yard fit and finish time; add `preferredYardId`.

Acceptance:
- Forecast panel names the chosen yard (display name) and lists every yard with fit/no-fit reason and months.
- Preferred-yard control: NOT built (ADR-0076 decision 1): the engine does not consume yards, so a preference would change the forecast only.
- Tests: pure view (fit reasons, preference, fallback, determinism), render, snap capture.

## Comments

### 2026-10-09 orchestrator

Implemented. `yardMisfits` in `yards.ts`; `forecast.yards: YardOption[]` in the workshop view (all yards, exceeded limits, months, chosen); `YardList` + `yardRows` in the Forecast panel with a "forecast only" tooltip. Tests: `yards.test.ts` (misfit boundaries and order), `workshop.test.ts` (list, chosen, no-fit, no-yards), `yardRows.test.ts`, DrawingBoard render test. Package `dist` must be rebuilt (`pnpm --filter @bluewave/ship-design build`) for the desktop to see new view fields. `pnpm snap` captured: three yards, medium chosen on a tie with large (smallest wins).
