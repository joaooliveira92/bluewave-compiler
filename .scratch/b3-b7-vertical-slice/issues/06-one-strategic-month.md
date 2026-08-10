# 06 — One strategic month: budget, appropriation, construction

**What to build:** Execute one full strategic month: opening validation, one budget/project command from the player, reservation and lock, appropriation, mandatory obligation, paid construction progress, one named research/project random decision, closing invariants, canonicalization, hashing. Treasury never silently becomes negative and financial postings balance. Construction progress is based on paid work and never exceeds total work.

**Blocked by:** 05

**Status:** ready-for-agent

- [ ] Player command: one budget/project command
- [ ] Appropriation phase
- [ ] Mandatory obligation phase
- [ ] Paid construction work phase
- [ ] Named research/project random decision (using engine from 02)
- [ ] Financial ledger with balance invariants
- [ ] Treasury negative-balance enforcement
- [ ] Construction progress capped at total work
- [ ] Closing invariants for all aggregates
- [ ] Closing snapshot hash
- [ ] Same opening snapshot and commands yield identical closing hashes
- [ ] Tests: full month execution, treasury invariants, progress cap, hash determinism
