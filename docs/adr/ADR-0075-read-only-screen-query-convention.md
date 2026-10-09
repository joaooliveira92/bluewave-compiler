# ADR-0075: Read-only screen reads go through one query hook

## Status

Accepted 2026-10-09.

## Context

ADR-0071 set the target of **one** command-screen lifecycle convention and
extracted `foldCommandResult`, deferring the full migration. Separately, the
renderer has two ways a screen reads a projection at mount:

1. `useBridgeQuery` (`lib/use-bridge-query.ts`) — the shared read-only query
   hook: `loading | ready | error`, bridge-present and transport-failure
   handling, and stale-result discard, governed by `sessionId`/`revision`.
2. Hand-rolled `useState` + `useEffect` folds — the Overview screen and
   `useTreasuryScreen` each re-implemented the `inspectCampaign` read and its
   error mapping on top of their own `*-screen-state` reducers.

The hand-rolled Overview path duplicated the bridge-unavailable string and the
success/rejected fold, and caught no transport failure. It was a drift risk of
exactly the kind ADR-0071 names.

## Decision

1. **Read-only projection reads use `useBridgeQuery`.** A screen that only
   *reads* a projection folds the shared hook into the shape its view needs; it
   does not hand-roll mount/effect state.
2. **The base `inspectCampaign` read is one hook.** `lib/use-campaign-projection.ts`
   exposes `useCampaignProjection(sessionId)` — `useBridgeQuery` folded to
   `{ projection, loadError }` — and both the Overview and Treasury screens use
   it. The per-screen `useOverviewScreen`/`useTreasuryScreen` read hooks and the
   `overview-screen-state`/`treasury-screen-state` lifecycle reducers are deleted.
3. **View-models carry presentation values, views don't look them up.** The
   nation rail resolves flag art in `buildNationRail` (via `nation-flag.ts`), so
   `NationRailRow.flagUrl` is a value the component renders; the component holds
   no asset policy.
4. **Speculative, consumer-less helpers are removed, not relocated.** The
   projection metric helpers (`summarizeFleet`, `portCapacity`, `shipNames`,
   …) had no production callers.

## Consequences

Screens that render the base projection share one read hook and one convention;
no read-only screen re-implements mount/effect state. Command screens keep their
own submit lifecycle under ADR-0071.
