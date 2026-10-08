# 24: Tech and material gating for refit armour edits

**Type:** implementation
**Status:** resolved
**Blocked by:** none
**Frontier:** no

Source: ticket 21 review. `RefitPlan.armourSet` does not check that `materialId` or thickness is available at the campaign month, so a refit could install armour not yet introduced. Decide whether compile already gates this for new designs, and apply the same gate to refits, with a BLOCKING finding and tests.

## Comments

### 2026-10-08 implementator: resolved

Finding: compile did NOT gate armour material, introduction month or thickness for new designs (only components and plants went through `techCheck`). Added one shared gate, `armourAvailabilityFindings` (`packages/ship-design/src/armour.ts`), driven by an optional `ArmourBalance.materialAvailability` table (`requires`, `fromMonth`, `obsoleteMonth`, `maxThicknessUm` per material). A material with no entry is unrestricted, so current content and all existing behaviour are unchanged.

- `compileStructure` (`compileStages.ts`) runs the gate over all regions of a new design.
- `evaluateRefit` (`refit.ts`) runs the same function over `armourSet` only, emitting `REFIT_ARMOUR_TECH_UNAVAILABLE` / `REFIT_ARMOUR_THICKNESS_UNAVAILABLE` (BLOCKING) and `REFIT_ARMOUR_MATERIAL_OBSOLETE` (ADVISORY, as for components). The generic new-findings diff skips the two blocking compile ids so they are not reported twice, and existing out-of-gate regions are not re-judged.
- Tests in `packages/ship-design/test/refit.test.ts`: available, missing tech, not yet introduced (and legal once introduced), obsolete advisory, thickness limit and boundary, same gate blocks `compileDesign`, existing region not re-judged, no availability table unchanged, determinism.

Not done (content, other agents own balance.yaml): `content/production/1880/ship-building/balance.yaml` has no `materialAvailability` data yet, so the gate is inert in the real game until research supplies per-material introduction months, tech ids and thickness limits. Follow-up needed for that content.

Validation (`packages/ship-design`): `vp test run` 276 passed; `pnpm typecheck` and `pnpm lint` clean (the earlier TS7008 in `shipBuildingContent.ts` was another agent's in-flight edit and has since cleared); `vp fmt` on changed files clean.
