# 05 — Fleet visibility and honest stub surface

**What to build:** on the open campaign, the Fleet Movement screen renders
honestly for a freshly compiled campaign — the fleet/dashboard panels appear,
the divisions list shows the actual compiled state (an honest empty state,
never an error card), and the movement-order surface is presented as
available-but-disabled because movement commands are not yet implemented in
the bridge.

**Blocked by:** 04 — Construction submit / replace / cancel

**Status:** resolved

- [x] Spec appended to the serial `mvp-loop` narrative (matrix row 6),
      opening the file-scoped shared save.
- [x] Asserts the Fleet screen renders its panels with the compiler's honest
      divisions state — real compiled state, not an error.
- [x] Asserts the movement-order surface is honestly not-submittable (the
      bridge commands are `NOT_IMPLEMENTED`) — no fabricated success copy
      (stub-surface contract).
- [x] All assertions user-visible only; hermetic; serial; workers: 1.
- [x] Exact `test:e2e` command + results recorded; clean working tree;
      small conventional commit(s).

## Answer

Resolved. `apps/desktop/e2e/mvp-loop.spec.ts` row 6, appended after row 5.

**Correction to the ticket's premise:** "the compiler emits no divisions"
does not hold for the Austria-Hungary production scenario — this nation has
one authored starting division, `fleet_aut_adriatic` ("Österreichische
Flotte", SMS Custoza + SMS Tegetthoff, home area Adriatic Coast
Pola/Trieste). The Divisions panel's honest state for this campaign is
therefore **one real division**, not an empty list; row 6 asserts the
divisions heading and that division rendering, never an error card.

Because a division is present, `OrderSection`'s Submit control is not
disabled by "no division selected" (it auto-selects the sole division and a
default destination) — the honest stub-surface here is behavioral, not a
disabled button: clicking "Submit movement command" reaches the bridge,
which returns `NOT_IMPLEMENTED` (`campaignBridge.ts`'s default case;
`fleetCommands.ts` documents `submitMovementCommand` as still a
desktop-mvp-ticket-11 scaffold), and the workflow surfaces that as a
`NOT_IMPLEMENTED: ...` notice Alert — never a fabricated success message.
Row 6 asserts exactly that: click Submit, assert the `NOT_IMPLEMENTED`
notice.

**Validation**: `pnpm --filter @bluewave/desktop build` then
`pnpm --filter @bluewave/desktop test:e2e` → `13 passed` (full suite through
matrix rows 0–10, tickets 01–06). `tsc --noEmit --strict` on the e2e files →
clean; `vp lint apps/desktop/e2e` → 0 warnings/errors; desktop unit suite →
`49 files / 360 tests passed`, unaffected.