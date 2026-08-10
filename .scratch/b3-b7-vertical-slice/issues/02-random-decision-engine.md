# 02 — Random decision engine and audit ledger

**What to build:** A hierarchical domain-separated random decision service with stable stream keys, auditable draw records, and zero ambient randomness. Every random outcome records: stream identity, stable entity key, phase, ruleset version, input hash, draw or derived value, outcome, and reason code. The engine must not expose a generic global or subsystem `nextRandom()` — every random decision is explicitly named and domain-separated.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] `RandomEngine` interface with domain-separated streams
- [ ] `RandomDecision` audit record type
- [ ] `RandomLedger` for accumulating and hashing decisions
- [ ] No generic global or subsystem `nextRandom()` exposed
- [ ] RNG decisions are stable when unrelated reporting/UI queries are inserted
- [ ] Tests: deterministic sequences, domain separation, audit record structure
- [ ] ADR for random decision architecture
