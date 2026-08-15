# 03 — Advance a Strategic month

**What to build:** from an open campaign, the player advances one Strategic
month through the Simulation & Turn screen (the header's primary action) and
the calendar/turn visibly advances past the starting month, with no error
card and prior state consistent.

**Blocked by:** 02 — New Game compiles a campaign

**Status:** ready-for-agent

- [ ] Spec appended to the serial `mvp-loop` narrative (matrix row 2); boots
      a fresh app and opens the file-scoped shared save created by spec 02.
- [ ] Asserts user-visible advancement: the turn/month indicator changes past
      its starting value after triggering the primary action; no error card;
      the screen reflects committed month output.
- [ ] Fixed seed in the shared save makes the month's outcomes deterministic
      (set by spec 02 — the assertion must not depend on a different seed).
- [ ] Passes hermetically (built app, no dev server), serial, workers: 1.
- [ ] Exact `test:e2e` command + results recorded; clean working tree;
      small conventional commit(s).