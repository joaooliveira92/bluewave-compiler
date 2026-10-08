# 23: Per-yard capacity scaled to maxDisplacement

**Type:** implementation
**Status:** resolved
**Blocked by:** none
**Frontier:** yes

Source: ADR-0067 §6. `yardCapacityWorkPerMonth` is a global PLACEHOLDER (20,000,000) that makes the capacity schedule nearly irrelevant to the forecast. Replace it with per-yard capacities scaled to each yard's maximum displacement so the "limited by <line>" bottleneck is meaningful, with boundary and determinism tests.

## Comments

### 2026-10-08 implementator

Implemented per ADR-0067 section 6 (updated). New `packages/ship-design/src/yards.ts` (`Yard`, `yardCapacityFor`, `buildYards`, `yardFits`; integer floor, ascending capacity then id, positive-integer rate validated). `WorkshopEnvironment.yardCapacity` replaced by `yards`; `buildShipBuildingContent` builds them from `environment.facilities` and the new `environment.yardWorkPerTonneMonth` (700, ESTIMATE) in `balance.yaml`, which now lists `yard_small` / `yard_medium` / `yard_large`. `buildWorkshopView` simulates each fitting yard, picks the smallest `max(historical, schedule)` (smallest yard on a tie), keeps forecast = max(historical, schedule), and adds `forecast.yardId`. Notes: "No shipyard can build this hull." (none fit) and "No shipyard that can hold this hull finishes it within N months (largest: <id>)" (all stall).

Results: Havock (303 t) -> yard_small, 18 months; Majestic (12,770 t) -> yard_large, 34 months, bottleneck slipway; small and medium cannot hold Majestic.

Tests: `test/yards.test.ts` (scaling, floor, invalid rate, ordering determinism, inclusive boundary at each limit, shipped content monotonic), `test/workshop.test.ts` (yard choice, schedule lengthens and bottleneck named under weaker capacity, both note cases, determinism). Commands: `packages/ship-design` `npx vp test run` -> 272 passed, 4 failed in `test/refit.test.ts` (ticket 24 in progress by another agent, armour cost balance); `npx tsc --noEmit` and `npx vp lint .` clean; `phase-engine` `npx vp test run submit-design` 8 passed; `apps/desktop` construction screens 27 passed, `npx tsc -b` clean; `npx vp fmt --check packages/ship-design content` clean. `apps/desktop/src/main/campaignBridge.test.ts` has one failure (INVALID_PAYLOAD vs NOT_IMPLEMENTED) unrelated to yards.

Not done: the Drawing Board does not yet display `forecast.yardId` (panels.tsx is in ticket 22's hands).
