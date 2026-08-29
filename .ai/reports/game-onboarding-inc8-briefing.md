# Validation Report — game-onboarding INC-8 (Opening Strategic Briefing)

**Sprint:** Campaign commissioning flow, INC-8 (final ticket). `.scratch/game-onboarding/`.
**Date:** 2026-08-16.
**Branch:** `dev`.

## What shipped

1. **Engine read-only projection** `packages/campaign-engine/src/opening-briefing.ts`
   — `buildOpeningBriefingProjection(state, playerSlotId, month)`, exported via
   `src/index.ts`. Derives every briefing field from the compiled `CampaignSnapshot`
   with no fabricated values and no new domain concept:
   - _State of the Navy_: ship-class inventory tally (fleet ships' `designVersionId`
     → design catalog → `hullType` → `constructionShipTypeLabel`), ships-under-construction
     (non-COMPLETED `ship` construction projects), most-expensive-active-class
     (max `projectedConstructionOrderCosts` over active ships' designs), largest-available-dock
     (max port `level`), total maintenance (**derived from fleet ships by replicating the
     engine's `computeMaintenanceCost` = floor(hitPoints/10), versioned `MAINTENANCE_FORMULA_ID`** —
     `NationState.maintenanceCost` is always 0 before the first `commitMonth`, so reading it
     would fabricate £0; verified via reviewer BLOCKER), construction committed (aggregate
     project `paidWork`, honestly labeled as cumulative — `MonthReport.newConstructionSpending`
     is a monthly figure that only exists after a `commitMonth`).
   - _Treasury_: government allocation (income × `navalAppropriationRateBp` via the engine's
     `scaleValue`, identical to `PlayerProjectionEconomy.monthlyAppropriation`), fleet
     maintenance (ship-derived, matching `MonthReport.maintenanceCost`), construction committed,
     research expenditure (`ResearchState.researchBudget`), projected surplus/deficit, and a
     qualitative `healthy/narrow/deficit/critical` status over the real surplus (thresholds
     documented as implementation detail, guarded against zero/negative allocation).
   - _Foreign Intelligence_: per-rival relations label + tension only (**reuses
     `buildDiplomacyScreenProjection`** — no ship counts, no intel-quality tiering — both
     out-of-scope fog-of-war concepts).
   - _Immediate Concerns_: four categories (obsolescence, budget shortfall, near-complete
     construction, low research spending) each triggered by real snapshot data; no
     "understaffed region" category.
   - Returns `undefined` for an unknown player slot (same convention as `buildPlayerProjection`).
   - _Immediate Concerns_: four categories (obsolescence, budget shortfall, near-complete
     construction, low research spending) each triggered by real snapshot data; no
     "understaffed region" category.
   - Returns `undefined` for an unknown player slot (same convention as `buildPlayerProjection`).

2. **Bridge command** `inspectOpeningBriefing(sessionId)` — added to
   `CAMPAIGN_COMMAND_NAMES` + `CampaignCommandClient` overload
   (`apps/desktop/src/shared/campaign-command-contract.ts`), handler
   `apps/desktop/src/main/commands/inspectOpeningBriefing.ts`, registered in
   `campaignBridge.ts` (session lookup → `SESSION_NOT_FOUND`, player-slot →
   `UNKNOWN_PLAYER_SLOT`).

3. **Screen** `apps/desktop/src/renderer/screens/new-game/NewGameBriefingScreen.tsx` —
   the 5-page linear briefing (Appointment / State of the Navy / Treasury Position /
   Foreign Intelligence / Immediate Concerns) with page-1 "Review Naval Estimates",
   generic Next/Back, and page-5 "Take command". Pure navigation state in
   `new-game-briefing-screen-state.ts`.

4. **Shell handoff** — `useNewGameFlow` now, on successful compile, auto-advances
   into the briefing (`opening-briefing`) carrying the session id; "Take command"
   (`takeCommand`) calls `openCampaign` into the existing, unchanged Overview dashboard.
   New `opening-briefing` screen/mode wired through `campaign-screen-registry.tsx`,
   `campaign-shell-state.ts`, `App.tsx`, `AppSidebar.tsx`.

## Tests

- `packages/campaign-engine/test/opening-briefing.test.ts` — 6 tests (undefined slot;
  State-of-the-Navy joins incl. ship-derived maintenance; Treasury + qualitative status;
  Foreign Intelligence relations-only; all four Immediate Concerns). **57/57 campaign-engine green.**
- `apps/desktop/src/renderer/screens/new-game/NewGameBriefingScreen.test.tsx` — 3 tests
  (page-1 render, full 5-page walk + Take command, error state).
- `new-game-briefing-screen-state.test.ts` — navigation clamping + labels.
- `useNewGameFlow.test.ts` — updated launch → briefing handoff + `takeCommand` (2 tests).
- `App.test.tsx` — updated to route world-gen → briefing → Take command.
- `campaignBridge.test.ts` — `inspectOpeningBriefing` payload/session error paths.
- Focused run: **75/75 green** across the touched desktop suites.

## Reviewer

Adversarial reviewer pass (reviewer subagent) found and fixed a **BLOCKER**: the first cut
read `NationState.maintenanceCost`, which the compiler unconditionally sets to 0 and only
`commitMonth` populates — so it always reported £0 at briefing time. Fixed by deriving
maintenance from fleet ships (replicated `computeMaintenanceCost`). Also reconciled
construction spend as honestly-cumulative "construction committed" and reused
`buildDiplomacyScreenProjection` for relations. Review verdict after fixes: blocker cleared
(remaining items were LOW/non-blocking repo-convention notes).

## Validation gate

- Clean uncached build `pnpm -w turbo run build --force`: **18/18 PASS**.
- `tsc -b` (campaign-engine + desktop): **PASS**.
- `vp fmt --check` + `vp lint` on every touched file: **PASS**.
- Full test suite: desktop **427/450** (all 23 failures are the **pre-existing
  `events` Zod-`datetime` regression** — `EventLedger.append` →
  `parseDomainEventEnvelope` rejects `timestamp: "turn-<n>"` produced by
  `MonthExecutor`; affects `commitMonth`/continuity/construction/research/diplomacy
  suites and the phase-engine package). campaign-engine **57/57 PASS**.
- Golden verify (`node scripts/verify-golden-hashes.cjs`) and the two-process
  determinism gate are blocked by that same pre-existing events regression.

## Pre-existing, recorded, NOT introduced here

The `events` Zod-`datetime` regression is **committed concurrent-session WIP**
(commits `7b60154`, `9fee5da`) and was explicitly recorded as blocking the shared-tree
gate in the C-1 INC-8 and C-2 INC-8 reports. It is unrelated to INC-8 (this work adds
no snapshot-schema or hashing change; `inspectOpeningBriefing` is purely read-only).
Per the repo's established pattern for concurrent-session in-flight work, it is
**recorded, not repaired here** — a candidate for the owning session's next commit.

Two incidental repairs were made to pre-existing broken/blocking files that my typecheck
needed green: removed two stale unused imports in
`campaign-screen-registry.test.tsx` (exports were removed by a concurrent refactor) and
removed a pre-existing unused `waitFor` import in `App.test.tsx`.

## Traceability

- INC-1..INC-8 all marked **done** in `.scratch/game-onboarding/issues/`.
- `docs/PROGRESS.md` — new "Campaign commissioning flow (game-onboarding)" entry.
- Report: this file.
