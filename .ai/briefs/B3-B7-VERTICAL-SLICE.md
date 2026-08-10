# Milestone B3-B7: One-Month Deterministic Campaign Slice

## Objective

Compile a reduced non-production 1880 fixture into an initial campaign snapshot, execute one meaningful strategic month including a narrow battle auto-resolution, save atomically, reload, replay the same commands, and obtain identical snapshot and ledger hashes.

## Prerequisites

The deterministic content-compiler bootstrap is accepted. The agent must verify its actual contracts and hashes before implementation.

## Canonical requirements

BW-CMP-001, BW-CMD-001, BW-CMD-002, BW-DET-001 through BW-DET-004, BW-PER-001 through BW-PER-003, BW-STA-001, BW-STA-002, BW-TST-001 through BW-TST-003.

## Fixture scope

Create an unmistakably non-production fixture containing:

- reduced 1880 scenario;
- United Kingdom playable slot and one AI participant;
- two adjacent strategic areas;
- one possession and port per nation;
- a minimal valid technology prerequisite chain;
- one minimal valid legacy fleet per participant;
- one continuing construction project;
- balanced opening economy and financial ledger;
- one bilateral diplomatic relation;
- one deterministic battle opportunity.

Production validators must remain strict. Fixture-only constructs cannot appear in production packs.

## Required implementation

- Campaign compiler with typed fixed stages and meaningful intermediate representations.
- Minimum aggregate boundaries: CampaignState, WorldState, NationState, FleetState, ResearchState, WarState, PersistenceManifest, with minimal explicit PoliticalState and IntelligenceState shells.
- Versioned command envelope with expected snapshot hash and idempotency key.
- Separately typed immutable lifecycle records.
- Explicit command rejection and resolution outcomes.
- Versioned domain-event envelope and structured explanation trees.
- Hard-coded versioned monthly phase registry with declared read/write and RNG permissions.
- Opening validation, one budget/project command, reservation and lock, appropriation, mandatory obligation, paid project work, one named research/project random decision, battle opportunity, auto-resolution, closing invariants, canonicalization, and hashing.
- Explicit deterministic no-op evidence for unused canonical phases.
- Hierarchical named random decisions and audit ledger.
- Directory-based content-addressed persistence with atomic writes and recovery pointer.
- Load, replay, and verification use cases and CLI commands.
- Narrow auto-resolver using legal mapped assets, explained strength, named decisions, bounded damage/losses, domain events, and campaign consequences.
- AbortSignal propagation and deterministic cleanup.

## Acceptance tests

1. Repeated campaign compilation yields identical initial snapshot hash.
2. The same opening snapshot and commands yield identical closing snapshot, command, event, financial, and random-decision ledger hashes.
3. Save/load before advancement preserves future outcomes.
4. Child-process replay reproduces all authoritative hashes.
5. Stale expected snapshot hash is rejected.
6. Same idempotency key and canonical command returns the original result; a different command returns `IDEMPOTENCY_CONFLICT`.
7. An unlocked, invalid, or unreserved command cannot resolve.
8. Treasury never silently becomes negative and financial postings balance.
9. Construction progress is based on paid work and never exceeds total work.
10. No ship is in two unresolved battles and loss/damage maps to campaign assets.
11. RNG decisions are stable when unrelated reporting and UI-like queries are inserted.
12. Phase order, cursor, aggregate ownership, and permitted RNG families are enforced.
13. Deferred phases emit versioned no-op evidence and consume no randomness.
14. Corrupt or incompatible saves are rejected with stable diagnostics.
15. Cancellation leaves the active save pointer and committed artifacts valid.
16. The auto-resolver is labeled narrow and does not claim tactical equivalence.
17. Invariants run after every authoritative transition and at closing snapshot.

## Determinism evidence

Record:

- content artifact hash;
- initial campaign snapshot hash;
- closing snapshot hash;
- command ledger hash;
- domain event ledger hash;
- financial ledger hash;
- random-decision ledger hash;
- replay verification result.

Run in at least two clean child processes. Cross-OS release gating remains B8 unless CI capability already exists.

## Out of scope

Full historical scenario support, complete monthly mechanics, interactive tactical state, sophisticated AI, statistical calibration against tactical simulation, Electron ownership of engine state, production balance claims.

## Stop conditions

Stop on gameplay ambiguity, unexplained hash changes, need for unsupported formula/save migration, missing high-authority canonical content, or material expansion into a deferred system.

## Suggested milestone commits

```text
feat(campaign): compile reduced deterministic campaign fixture
feat(engine): resolve one strategic month through locked commands
feat(persistence): verify atomic save load and replay
feat(combat): add explained deterministic battle autoresolution
```
