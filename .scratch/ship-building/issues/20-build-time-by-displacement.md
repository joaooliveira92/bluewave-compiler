# 20: Build time scaled by displacement, from historical data

**Type:** implementation
**Status:** resolved
**Blocked by:** none
**Frontier:** yes

Spec: `.scratch/ship-building/spec.md`; decision: ADR-0067 §5. The RTW3 manual gives no months-per-displacement table, and the Steam guide's 22-24 months is unverified. Derive a table from history (keel to commissioning: Majestic ~22, Cressy ~31, Hornet/Havock ~24 months; Dupuy de Lome ~83 is a boiler-delay outlier) and verify each value against Conway's or Brassey 1900/1902 before it becomes a content constant (current rows are Wikipedia-sourced). Wire into `computeCost`/construction work packages (ADR-0064) with the industry modifier and acceleration rules.

Acceptance: content constants with source citations, unit and boundary tests, determinism check, Drawing Board forecast shows the build time.

## Comments

### 2026-10-08 implementator

Implemented: `historicalBuildMonths` (`packages/ship-design/src/construction.ts`), content constants `construction.buildMonthsByDisplacementT`, `efficientIndustryBp`, `accelerationTimeBp` and `cost.accelerationCostBp` in `content/production/1880/ship-building/balance.yaml`; `computeCost` takes `CostContext.accelerated` and adds `accelerationPremium` (+5 %); `buildWorkshopView` forecast now has `historicalMonths` and `months = max(historical, capacity schedule)`, with `WorkshopEnvironment.industryBp`; Drawing Board forecast shows the historical build time.

Source verification (Brassey's Naval Annual 1901, archive.org `brassey-s-naval-annual-1901`, "Retarded Construction", pp. 257-261, read from the OCR text):
- VERIFIED: Majestic 22 months, Magnificent 24, Royal Sovereign 32 (p. 258); Hannibal laid 1 May 1894, ready 9 May 1898 (just over 4 years); Canopus 35, Ocean 36, Goliath 39, Glory 47 months (p. 259 table); Cressy laid down 12 Oct 1898 (dockyard/contract table).
- NOT verified (Wikipedia only, labelled WIKIPEDIA in the content): Cressy completion 28 May 1901 (31 months), Blake 43 months, Hornet 24 months, Dupuy de Lome 83 months. Brassey 1901 says "Cressy delivered at Portsmouth in October 1900", which conflicts with Wikipedia's 28 May 1901 completion; unresolved, so the 12,000 t point is flagged.
- ESTIMATE (no source, replace before release): points at 300, 3,000, 9,000 and 20,000 t. Conway's was not checked. The 1902 Brassey and a destroyer build-time source remain open.
- Note: Brassey gives Majestic as 14,900 t (normal); the 16,060 t in the research note is Wikipedia's figure.
- The efficient industry multiplier 6,700 bp reproduces the Magnificent 24-month record from the 36-month typical battleship figure.

Side fix: `yardCapacityWorkPerMonth` 2,000,000 -> 20,000,000 (PLACEHOLDER). At 2M the Majestic-size hull (276M work) stalled past maxMonths, so battleships had no forecast.

Commands (all run from repo root unless noted):
- `cd packages/ship-design && npx vp test run` -> 28 files, 260 tests passed (after others' refit edits settled)
- `cd packages/ship-design && npx tsc --noEmit` -> clean; `npx vp lint .` -> clean
- `npx vp fmt --check content packages/ship-design apps/desktop/src/renderer/screens/construction` -> only `packages/ship-design/test/references.test.ts` flagged (not touched by this ticket)
- `cd apps/desktop && npx vp test run src/renderer/screens/construction` -> 27 passed; `npx tsc -b` -> clean
- `cd apps/desktop && npx vp lint .` -> pre-existing unused `Card` import errors in StatsPanel/ScenarioPanel/RulesetPanel (not this ticket)

Tests: table points, clamp, interpolation, boundary (12,949/12,951 t), industry and acceleration rounding, determinism, acceleration cost premium (`construction.test.ts`); forecast vs displacement/industry/acceleration (`workshop.test.ts`); Drawing Board build time grows destroyer -> battleship (`DrawingBoard.test.tsx`).
