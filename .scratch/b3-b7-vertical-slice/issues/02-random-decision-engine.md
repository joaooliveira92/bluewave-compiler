# 02 — Random decision engine and audit ledger

**What to build:** A hierarchical domain-separated random decision service with stable stream keys, auditable draw records, and zero ambient randomness. Every random outcome records: stream identity, stable entity key, phase, ruleset version, input hash, draw or derived value, outcome, and reason code. The engine must not expose a generic global or subsystem `nextRandom()` — every random decision is explicitly named and domain-separated.

**Blocked by:** 01

**Status:** resolved

- [x] `RandomEngine` interface with domain-separated streams
- [x] `RandomDecision` audit record type
- [x] `RandomLedger` for accumulating and hashing decisions
- [x] No generic global or subsystem `nextRandom()` exposed
- [x] RNG decisions are stable when unrelated reporting/UI queries are inserted
- [x] Tests: deterministic sequences, domain separation, audit record structure
- [x] ADR for random decision architecture

## Answer

Implemented `packages/random` with `RandomEngine`, `RandomStream`, `RandomLedger`, `drawUniform`, `drawBoolean`. Uses SHA-256 domain separation via `hashWithContext`. No global `nextRandom()` — streams are explicitly named. 16 tests pass.
