# Migrate the Treasury read onto the shared projection hook

**Type:** implementation
**Status:** resolved (2026-10-09)
**Blocked by:** none
**Frontier:** no
**Requirements:** ADR-0075

## Context

ADR-0075 moves read-only projection reads onto the shared `useBridgeQuery`
convention. The Overview adopted it; `useTreasuryScreen` was the last
hand-rolled `useState` + `useEffect` fold of `inspectCampaign`, duplicating the
bridge-unavailable string and catching no transport failure.

## Acceptance

- The base `inspectCampaign` read is one shared hook; no read-only screen
  re-implements mount/effect state.
- Redundant lifecycle reducers and tests are removed; `summarizeTreasury` /
  `buildBudgetBar` stay.
- `TreasuryScreen` behaviour unchanged: loading skeleton, load-error panel,
  figures, deficit flag, budget bar.

## Resolution (2026-10-09)

Because `useOverviewScreen` and `useTreasuryScreen` collapsed to byte-identical
folds, the fix went one step further than the ticket: `lib/use-campaign-projection.ts`
now exposes `useCampaignProjection(sessionId)` (`useBridgeQuery` → `{ projection,
loadError }`), and **both** Overview and Treasury read through it. Deleted
`useOverviewScreen.ts`, `useTreasuryScreen.ts`, and the lifecycle halves of
`overview-screen-state.ts` (whole file) and `treasury-screen-state.ts`
(`initialTreasuryScreenState` / `applyProjectionLoaded` / `applyLoadFailed`).
`TreasuryScreen.test.tsx` now mocks the shared hook with plain state literals;
`treasury-screen-state.test.ts` keeps only the `summarizeTreasury` /
`buildBudgetBar` cases. Overview tests 36/36, Treasury tests green, desktop
`tsc -b` / format / lint clean.

## Comments

Split from the Overview SOLID pass (2026-10-09). The broader ADR-0071
command-screen convergence remains separate.
