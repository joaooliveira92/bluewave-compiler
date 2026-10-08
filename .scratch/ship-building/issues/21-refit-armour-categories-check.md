# 21: Check ARMOUR_MODIFICATION against the manual's rebuild list

**Type:** implementation
**Status:** resolved
**Blocked by:** none
**Frontier:** yes

Decision: ADR-0067 §3 keeps the broader whole-`ARMOUR_SCHEME` rule. Add tests proving the manual's three rebuild cases (add 1 in deck armour, remove conning tower, change upper belt) are legal under `ARMOUR_MODIFICATION` and respect the life, fatigue and growth limits in `content/production/1880/ship-building/balance.yaml`. Report any case that is illegal.

## Comments

### 2026-10-08 implementator: BLOCKED, status left `open`

No code or tests changed. Finding: none of the manual's three rebuild cases (add 1 in deck armour, remove conning tower, change upper belt) can be expressed as an `ARMOUR_MODIFICATION` refit today, so they cannot be proven legal.

- `RefitPlan` is `{ kind, removeInstanceIds, add: PlacementSpec[] }` and `evaluateRefit` (`packages/ship-design/src/refit.ts`) only diffs `design.placements`.
- Armour lives in `design.armour.regions` (`DECK_MAIN`, `BELT_UPPER`, `CONNING_TOWER`, ...), not in placements. The `edits.ts` `set_armour_region` / `remove_armour_region` edits are not reachable from a refit plan.
- `ARMOUR_SCHEME` is in `allowedCategories` for `ARMOUR_MODIFICATION` (balance.yaml), but no component of that category exists in any catalogue or the 1880 content. The `allowedCategories` check therefore never matches anything real.
- Net effect: an `ARMOUR_MODIFICATION` plan can only add or remove placed components of category `ARMOUR_SCHEME`, so armour changes silently do nothing. Armour mass is never added to `netAddedKg`, the growth budget, or cost.

Limits that would apply once expressible (balance.yaml `refit.rules.ARMOUR_MODIFICATION`): REBUILD, `minRemainingLifeMonths` 24, `maxHullFatigueBp` 5000, `fatigueGainBp` 1000, `costMultiplierBp` 12000, `minMonths` 8, `lifeExtensionMonths` 12. These are generic `evaluateRefit` checks and are already covered by the SENSOR_FC_UPDATE tests.

Needed decision (rule/API change, so not made here): extend `RefitPlan` with armour-region edits (for example `armourSet: ArmourRegion[]` and `armourRemove: ArmourRegionId[]`), apply them to `newDesign.armour.regions`, and gate them on `ARMOUR_MODIFICATION` only. Then add the three tests. Alternatively, the ticket owner may choose to treat the `ARMOUR_SCHEME` category as a vestige and drop it from `allowedCategories`.

Validation (baseline, no changes): `cd packages/ship-design && pnpm test` -> 28 files, 244 tests passed.

### 2026-10-08 implementator: resolved (Option A)

`RefitPlan` gained optional `armourSet` / `armourRemove` (`packages/ship-design/src/refit.ts`). They are applied to `newDesign.armour.regions` (set replaces in place, new regions appended), blocked outside `ARMOUR_MODIFICATION` with `REFIT_ARMOUR_KIND_MISMATCH`, unknown removals give `REFIT_UNKNOWN_TARGET`. Armour mass, growth budget and cost flow through the existing compile/cost path (no new formulas). Plans without the fields behave and serialize exactly as before (`newDesign.armour` is the same object).

Tests added to `packages/ship-design/test/refit.test.ts`: +1 in DECK_MAIN, remove CONNING_TOWER, change BELT_UPPER (all legal), illegal under SENSOR_FC_UPDATE / REARMAMENT / MAJOR_RECONSTRUCTION, unknown region, growth budget, life and fatigue limits, determinism, backward-compatible serialization, JSON round trip. Note: 1 in over the fixture's 24 m x 5 m deck is about 27.6 t, so the test ship has a 40 t growth budget.

`ARMOUR_SCHEME` is left in `allowedCategories` and the enum (no content uses it; harmless, not deleted). ADR-0067 §3 updated.

Validation (in `packages/ship-design`): `pnpm exec vp test run test/refit.test.ts` 24 passed; `pnpm typecheck` clean; `pnpm lint` clean; `vp fmt` on changed files clean. Full `vp test run`: 259 passed, 1 failed (`workshop.test.ts` ticket-20 forecast test, another agent's in-flight work, unrelated). `ai.test.ts` fuzz test timed out once under load and passed on rerun.
