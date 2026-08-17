# 03 — Advance a Strategic month

**What to build:** from an open campaign, the player advances one Strategic
month through the Simulation & Turn screen (the header's primary action) and
the calendar/turn visibly advances past the starting month, with no error
card and prior state consistent.

**Blocked by:** 02 — New Game compiles a campaign

**Status:** resolved

- [x] Spec appended to the serial `mvp-loop` narrative (matrix row 2); boots
      a fresh app and opens the file-scoped shared save created by spec 02.
- [x] Asserts user-visible advancement: the turn/month indicator changes past
      its starting value after triggering the primary action; no error card;
      the screen reflects committed month output.
- [x] Fixed seed in the shared save makes the month's outcomes deterministic
      (set by spec 02 — the assertion must not depend on a different seed).
- [x] Passes hermetically (built app, no dev server), serial, workers: 1.
- [x] Exact `test:e2e` command + results recorded; clean working tree;
      small conventional commit(s).

## Answer

Resolved. `apps/desktop/e2e/mvp-loop.spec.ts` row 2, appended to the serial
narrative after row 1. Boot #2 opens the **file-scoped shared save** row 1
compiled (fixed `SEED` ⇒ same deterministic month outcomes):

1. Fresh app boot (hermetic, per-test scratch `userData`) → landing →
   `retargetDialog(sharedSaveDir)` → "Open Campaign" → shell lands on
   Overview (campaign-opened pins the screen to Overview).
2. Assertions on the **committed state**: "Campaign Overview" heading,
   "Revision 0" (revision = turnNumber, fresh compile ⇒ 0), header title
   "Bluewave — January 1880" (turn 0 = scenario / DEFAULT_CAMPAIGN_START
   Jan 1880).
3. Header `Advance Month` control (the advance action exposed on the
   toolbar; disabled/"Advancing…" during commit) → `commitMonth`.
4. User-visible advancement: header title "Bluewave — February 1880" (the
   commit's `closingSnapshot.month` drives the header calendar via
   `formatCampaignMonth`) and the shell notice "Month advanced to February
   1880." appears; "Could not advance month" error surface never renders.

**Assertion-surface decision:** the Overview screen's description is a
local, session-scoped projection that does not reload after commit, so row 2
asserts the **header calendar + notice** (both driven by the committed shell
state) rather than the stale Overview description — honest, deterministic
signal per the stub-surface contract.

**Validation**: `pnpm --filter @bluewave/desktop build` (fresh electron-vite
build) then `pnpm --filter @bluewave/desktop test:e2e` → `3 passed (3.4s)`
(mvp-loop rows 1–2 + hermetic smoke). Row-2 uses the ratified
`retargetDialog` + "Open Campaign" surface unchanged; the only fixture change
was **fixing the harness's lint break at `fixtures.ts:97`** — the fixture
arg `async ({}, use)` tripped `eslint(no-empty-pattern)`. `_` is rejected by
Playwright at runtime ("first argument must use the object destructuring
pattern"), so the empty pattern was kept with a targeted
`eslint-disable-next-line no-empty-pattern` (repo-style suppression, see the
map-prototype screens) rather than weakening the lint rule. Gates:
`vp lint .` → 0 warnings/0 errors; `tsc -b` clean; desktop unit suite →
`44 files / 303 tests passed`.