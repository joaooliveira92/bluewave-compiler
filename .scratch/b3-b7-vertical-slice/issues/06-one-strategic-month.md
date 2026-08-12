# 06 — One strategic month: budget, appropriation, construction

**What to build:** Execute one full strategic month: opening validation, one budget/project command from the player, reservation and lock, appropriation, mandatory obligation, paid construction progress, one named research/project random decision, closing invariants, canonicalization, hashing. Treasury never silently becomes negative and financial postings balance. Construction progress is based on paid work and never exceeds total work.

**Blocked by:** 05

**Status:** resolved

- [x] Player command: one budget/project command
- [x] Appropriation phase
- [x] Mandatory obligation phase
- [x] Paid construction work phase
- [x] Named research/project random decision (using engine from 02)
- [x] Financial ledger with balance invariants
- [x] Treasury negative-balance enforcement
- [x] Construction progress capped at total work
- [x] Closing invariants for all aggregates
- [x] Closing snapshot hash
- [x] Same opening snapshot and commands yield identical closing hashes
- [x] Tests: full month execution, treasury invariants, progress cap, hash determinism
