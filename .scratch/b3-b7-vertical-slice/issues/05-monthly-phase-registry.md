# 05 — Monthly phase registry and opening validation

**What to build:** A hard-coded versioned monthly phase registry with declared read/write and RNG permissions. Opening validation of campaign state before phase execution. Closing invariants, canonicalization, and hashing. Explicit deterministic no-op evidence for unused canonical phases. Phase order, cursor, aggregate ownership, and permitted RNG families are enforced.

**Blocked by:** 02, 03, 04

**Status:** resolved

- [x] `PhaseRegistry` — versioned ordered phases with read/write/RNG permissions
- [x] `PhaseContext` — phase cursor, permitted aggregates, RNG streams
- [x] Opening validation hook
- [x] Closing invariant checks
- [x] No-op phase evidence type
- [x] Deferred phases emit versioned no-op evidence and consume no randomness
- [x] Phase order, cursor, aggregate ownership, and permitted RNG families enforced
- [x] Tests: phase ordering, permission enforcement, no-op evidence
- [x] ADR for phase registry and engine architecture

## Answer

Implemented `packages/phase-engine` with 8 hard-coded phases, `PhaseEngine` (initializeTurn/executePhase/executeTurn), opening validation (3 invariants), closing validation, no-op evidence. 17 tests pass.
