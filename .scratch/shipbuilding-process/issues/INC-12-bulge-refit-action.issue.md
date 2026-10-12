# INC-12 — BULGE refit action

**State:** RESOLVED (domain + balance core; UI rebuild surface split to INC-12b) · **Frontier:** yes · **Blocked by:** none
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R25, R27) · **ADR:** bulges refit action (ADR-0130)

## What to build

Add the one rebuild action the manual lists that the app cannot do yet: **bulges** — "increase torpedo
protection but will also reduce speed". It is an ordinary rebuild, validated like every other.

## Acceptance criteria

- [ ] A new `BULGE` refit kind raises torpedo-defence/protection at a speed penalty; it is validated by
      the normal compile (mass, stability, speed) and its protection-gain and speed-penalty constants are
      versioned (BALANCE TARGET — the manual gives directions, not numbers).
- [ ] `BULGE` runs **inside** the existing `rebuild_validation_v1` retained-hull path (displacement
      `+20 %`, speed `+3 kn`, length/beam `±5 %`, no hull-category change) and the normal rebuild
      result (one new `CompiledDesignVersion`, atomic per-ship switch, classification re-run) — not
      beside it.
- [ ] The rebuild surface on the Construction screen offers the bulge action.
- [ ] Tests: unit (protection up, speed down; compile passes/fails on mass/stability); boundary (no
      speed left to give); determinism (result hash stable); `pnpm snap` of the rebuild surface.

## Notes for implementator

Extends the refit-kind union and the armour/rebuild subset already delivered by SB tickets 21/28
(ADR-0067 §3, ADR-0078). New ADR records the kind and its constants.

## Answer

The `BULGE` refit kind is added; the rebuild-surface UI is split to **INC-12b** (needs a captured screen).

- `RefitKind` gains `BULGE` (project type `REBUILD`, so it runs through `rebuild_validation_v1` and the normal
  compile). `RefitPlan.bulge` carries the blister's added mass; the compile re-derives displacement/stability/speed
  and the speed penalty emerges from the heavier hull.
- `RefitBalance` gains the versioned `bulgeProtectionGainBp` / `bulgeSpeedPenaltyBp` (BALANCE TARGET); authored in
  `content/production/1880/ship-building/balance.yaml` and the test fixture.
- New findings: `REFIT_BULGE_REQUIRED`, `REFIT_BULGE_KIND_MISMATCH`. `RefitEvaluation.bulgeProtectionGainBp`
  reports the credited protection.
- ADR-0130 records the kind and constants; tests pin protection credit, speed drop, the required-blister and
  wrong-kind gates, and the growth-budget failure.
- Deferred: the rebuild surface action + `pnpm snap` → **INC-12b** (recorded, not dropped).

Commands: `@bluewave/ship-design` `vp test run test/refit.test.ts` (36 passed) and full suite (877 passed);
`tsc --noEmit` clean; `pnpm preflight` green.
