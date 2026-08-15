# Desktop E2E Coverage — 03: Spec Decomposition & Coverage Matrix

Type: grilling
Status: resolved
Blocked by: (none)

## Answer

Coverage matrix produced as the handoff deliverable:
`coverage-matrix.md` (in this effort directory). Decomposition:

- **`e2e/mvp-loop.spec.ts`** (serial) — one compiled campaign, chained
  narrative over the create-side loop — rows 1–6: New Game compiles (fixed
  `SEED`, nation Austria-Hungary, turn 0 Overview) → Advance a month →
  Construction submit / replace / cancel → Fleet visibility (honest empty
  divisions state, movement surface disabled).
- **`e2e/continuance.spec.ts`** (serial) — rows 7–11 against fresh copies of
  the shipped production package (never the shipped tree): Load restores
  (nation, turn 0) → Verify OK → Replay deterministic → Recover repairs a
  tampered copy (optional row) → tamper/verify mismatch (optional row).
- **Deliberately not in the matrix**: settings + dev screens (per map
  scope); movement ordering and save/close (bridge `NOT_IMPLEMENTED` — the
  matrix asserts the honest disabled surface, never fabricated success);
  Battle Arena e2e graduates when the M2 engine lands battle commands.

Suite definition of done: every matrix row has a passing hermetic spec in
the macOS CI gate; assertions are user-visible only (no envelope/hash
re-checks — those live in unit + cross-process tests). Selector plumbing
(`data-testid` only where ambiguous) is implementer choice; real current
copy labels embedded in the matrix (verify at build time).

Key charting context preserved: scope = full MVP playable loop; dev/settings
screens out; continuance = copied production package, never the shipped
tree; determinism via typed fixed u128 seed.