# 02 — New Game compiles a campaign

**What to build:** the suite's first real flow — from the landing screen, a
player creates a new campaign (pick an archetype preset, fill preferences
including the fixed seed, choose Austria-Hungary) and lands on Campaign
Overview showing the freshly compiled campaign: nation Austria-Hungary,
turn 0.

**Blocked by:** 01 — Harness scaffold runs green

**Status:** ready-for-agent

- [ ] Spec exists in the serial `mvp-loop` file and is the first spec in the
      narrative: it compiles a fresh campaign into the file-scoped shared
      save dir (matrix row 1).
- [ ] Asserts user-visible state after compiling: Overview header shows, the
      campaign identity names Austria-Hungary and turn 0 — no IPC/envelope
      assertions.
- [ ] Fixed seed `ba44581c2f1d8e5c9753ffc80be8e6a0` is typed into the
      Campaign Seed field (valid u128 hex, per the map).
- [ ] Passes hermetically (built app, no dev server) via the harness; serial
      mode keeps it deterministic (workers: 1).
- [ ] Exact `test:e2e` command + results recorded; clean working tree;
      small conventional commit(s).