# 07 — Content-addressed persistence

**What to build:** Directory-based content-addressed persistence with atomic writes and recovery pointer. Save files: pin content, formula, AI, RNG, and format compatibility versions. Atomic commit: write temporary content, validate, hash, commit, update active pointer, retain recoverable prior state. Load reads and validates. Corrupt or incompatible saves rejected with stable diagnostics. AbortSignal propagation and deterministic cleanup.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Content-addressed save directory layout
- [ ] Atomic write: temp → validate → hash → commit → update pointer
- [ ] Recovery pointer and prior-state retention
- [ ] Compatibility version pinning and rejection
- [ ] Load and deserialize
- [ ] Corrupt/incompatible save rejection with stable diagnostics
- [ ] AbortSignal propagation
- [ ] Deterministic cleanup on failure
- [ ] Tests: atomicity, recovery, compatibility rejection, cancellation
- [ ] ADR for persistence architecture
