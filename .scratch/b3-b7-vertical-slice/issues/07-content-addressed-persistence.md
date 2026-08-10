# 07 — Content-addressed persistence

**What to build:** Directory-based content-addressed persistence with atomic writes and recovery pointer. Save files: pin content, formula, AI, RNG, and format compatibility versions. Atomic commit: write temporary content, validate, hash, commit, update active pointer, retain recoverable prior state. Load reads and validates. Corrupt or incompatible saves rejected with stable diagnostics. AbortSignal propagation and deterministic cleanup.

**Blocked by:** 01

**Status:** resolved

- [x] Content-addressed save directory layout
- [x] Atomic write: temp → validate → hash → commit → update pointer
- [x] Recovery pointer and prior-state retention
- [x] Compatibility version pinning and rejection
- [x] Load and deserialize
- [x] Corrupt/incompatible save rejection with stable diagnostics
- [x] AbortSignal propagation
- [x] Deterministic cleanup on failure
- [x] Tests: atomicity, recovery, compatibility rejection, cancellation
- [x] ADR for persistence architecture

## Answer

Implemented `packages/persistence` with `SaveStore` (atomic save/load with temp files + renameSync), `CompatibilityChecker`, `RecoveryManager`. 14 tests pass covering save/load, hash verification, corruption rejection, version mismatch, cancellation, multi-save integrity, and recovery.
