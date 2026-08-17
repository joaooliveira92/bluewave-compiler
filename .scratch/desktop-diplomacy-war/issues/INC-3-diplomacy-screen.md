# INC-3 — Diplomacy & War renderer screen

**Type:** task
**Status:** resolved
**Blocked by:** INC-2

## What to build

`apps/desktop/src/renderer/screens/diplomacy/`:

- `diplomacy-screen-state.ts` pure reducer (idle/loading/loaded(ansot)/error/
  submitting/submitted/rejected-with-revision) + tests.
- `DiplomacyScreen.tsx` — 3 cards per map ticket 03:
  - **Relations**: per known nation rows (nation name, relation label, tension,
    nap badge, since) with per-row action controls enabled from the projected
    state (DeclareWar unless at war; FormAlliance on neutral; BreakAlliance on
    allied; NAP form/break; DeclareBlockade on at-war pairs); Submit uses the
    shell `expectedRevision`/`transportRequestId` optimistic-concurrency flow.
  - **Wars**: active + ended player-involved wars (sides, scores, status,
    start/end) with AcceptPeace on ACTIVE member wars.
  - **Blockades**: blockader→blockaded in area, established month.
  - Honest copy: "applies on the next turn advance"; engine-code rejection
    notices; empty states ("no wars yet").
- Register in `campaign-screen-registry.tsx` ("diplomacy", "Diplomacy & War",
  e.g. `Handshake`/`Swords` lucide icon, campaign group, searchable).
- Reuse existing ui primitives + `PageHeader`; reducer + render tests.

## Acceptance (spec AC-2..AC-4 renderer side)

- Screen renders real projection or honest error/empty state.
- Submit surfaces the optimistic-concurrency envelope; stale revision refreshes.
- Reducer/render tests green; no clock/env/random in the reducer.

## Validation

`pnpm -w turbo run test --filter=@bluewave/desktop`, `tsc -b` clean.