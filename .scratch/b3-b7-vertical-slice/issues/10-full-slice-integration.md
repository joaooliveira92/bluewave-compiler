# 10 — Full-slice integration and determinism proof

**What to build:** Run the full B3-B7 acceptance suite across child processes. Record all 8 authoritative hashes: content artifact hash, initial campaign snapshot hash, closing snapshot hash, command ledger hash, domain event ledger hash, financial ledger hash, random-decision ledger hash, and replay verification result. Invariants run after every authoritative transition and at closing snapshot.

**Blocked by:** 08, 09

**Status:** resolved

- [x] Integration test: compile fixture → initial snapshot hash
- [x] Integration test: execute one month → closing snapshot hash + all ledger hashes
- [x] Integration test: child-process replay reproduces all hashes
- [x] Invariant checks after every transition
- [x] Record all 8 hashes in validation output
- [x] Cross-process determinism evidence (same binary, same hashes)

## Answer

Integration test file with 17 tests covering all B3-B7 acceptance criteria. All 154 tests pass across 14 packages: 20 (contracts) + 7 (diagnostics) + 11 (deterministic) + 3 (content-schema) + 5 (content-compiler) + 4 (campaign) + 16 (random) + 6 (commands) + 9 (events) + 14 (persistence) + 10 (combat) + 27 (phase-engine: 17 engine + 10 month) + 5 (cli) + 17 (integration).