# 10 — Full-slice integration and determinism proof

**What to build:** Run the full B3-B7 acceptance suite across child processes. Record all 8 authoritative hashes: content artifact hash, initial campaign snapshot hash, closing snapshot hash, command ledger hash, domain event ledger hash, financial ledger hash, random-decision ledger hash, and replay verification result. Invariants run after every authoritative transition and at closing snapshot.

**Blocked by:** 08, 09

**Status:** ready-for-agent

- [ ] Integration test: compile fixture → initial snapshot hash
- [ ] Integration test: execute one month → closing snapshot hash + all ledger hashes
- [ ] Integration test: child-process replay reproduces all hashes
- [ ] Invariant checks after every transition
- [ ] Record all 8 hashes in validation output
- [ ] Cross-process determinism evidence (same binary, same hashes)
