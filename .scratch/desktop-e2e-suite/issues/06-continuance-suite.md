# 06 — Continuance suite: load / verify / replay / recover

**What to build:** the save-continuity half of the suite. From the landing
screen, the player's package operations work against a real on-disk
production save: Load restores the package to Overview (Austria-Hungary,
turn 0), Verify reports integrity, Replay completes deterministically, and
Recover repairs a damaged package — optionally with a tamper→mismatch check.
Every spec targets a **copy** of the shipped production package; the shipped
tree is never mutated.

**Blocked by:** 01 — Harness scaffold runs green (the create-side narrative
is not a prerequisite — this file is independent, but the fixture-copy
helper from the harness is).

**Status:** ready-for-agent

- [ ] Spec file (`continuance` suite) with exclusive paths to a fresh copy of
      the shipped production package for each row (matrix rows 7–11).
- [ ] Load: Overview restored with the package's nation and turn (restored to
      turn 0; campaign identity intact).
- [ ] Verify: integrity report surfaces an OK/valid state; the app remains
      operable (can reach Overview).
- [ ] Replay: deterministic replay completes cleanly end to end ("Replay
      verified" indicator) — no hash/golden assertions here, per the map
      (owned by the cross-process gate).
- [ ] Recover: a tampered copy surfaces the corruption and recovers to a
      playable package (opens to Overview) without crashing. Tamper→Verify
      mismatch is included only if it's stable using the harness's corrupted
      fixture; otherwise the recover row is the minimum (per the matrix
      note).
- [ ] Shipped fixture package untouched (copies only, provenance-checked).
- [ ] All assertions user-visible only; hermetic; serial; workers: 1.
- [ ] Exact `test:e2e` command + results recorded; clean working tree;
      small conventional commit(s).