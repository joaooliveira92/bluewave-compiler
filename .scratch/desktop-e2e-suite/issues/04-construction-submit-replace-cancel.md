# 04 — Construction submit / replace / cancel

**What to build:** on an open campaign, the player orders a construction
command (pick a design, Submit) and sees it land in the Shipyard Ledger's
command table; then replaces it with another design; then cancels it — each
step arriving at an honest, snapshot-consistent table state.

**Blocked by:** 03 — Advance a Strategic month

**Status:** ready-for-agent

- [ ] Three specs appended to the serial `mvp-loop` narrative (matrix rows
      3–5), opening the file-scoped shared save.
- [ ] Submit: design row appears in the construction command table with a
      status ≈ under construction / building, reflecting the screen's
      snapshot projection.
- [ ] Replace: the in-flight command is replaced with another design and the
      table shows the replacement with no residue (replace is
      failure-atomic per the map).
- [ ] Cancel: the command leaves the live table and the snapshot reflects
      the cancel.
- [ ] All assertions user-visible only; deterministic (shared fixed-seed
      save); hermetic; serial; workers: 1.
- [ ] Exact `test:e2e` command + results recorded; clean working tree;
      small conventional commit(s).