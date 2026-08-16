# Ticket 05 — Engine-Core Effect Policy

**Type:** grilling
**Status:** resolved
**Blocked by:** 01-effect-v4-release-reality, 02-toolchain-compatibility, 03-incremental-adoption-path, 04-runtime-determinism-profile, 09-version-line-choice

## Question

Where exactly does the determinism wall sit once Effect v4 enters the codebase?
Which packages are the **authoritative engine core** whose outputs are covered
by golden hashes and cross-process determinism (`combat`, `phase-engine`,
`campaign`, `commands`, `deterministic`, `random`, `events`, `contracts`), and
which Effect constructs — Schema, Data, typed errors / `Cause`/`Either`,
`effect` runtime (Fibers/Clock/Random/Scheduler) — are permissible in which
layers? Under what documented conditions may golden hashes change (the ADR-0007
renumber rule: an authoritative documented cause + versioned-ruleset constant),
and what verification gate (golden verification, cross-process determinism,
full test suite) must pass before and after any engine-adjacent adoption?

This decision is the spine of the map — every later ticket hangs off it.
Work with the human via `/grilling` + `/domain-modeling`, zooming the four
research tickets as needed.

## Answer

The determinism wall is **lifted** (human decision, 2026-08-16):

- **Full Effect idiom is permitted in the authoritative engine core** — the
  runtime included (`Effect`/`Layer`/Fibers/services, the five live services).
  Maximum Effect value is the goal; no Effect construct is off-limits by policy.
  This supersedes the map's earlier "scoped, hashes-preserved" stance.
- **The golden-hash / determinism verification spine is demoted from a hard
  gate to deprecated machinery.** Golden-hash changes are permitted and
  recorded via ADR (a record, not a block). Cross-process determinism is no
  longer a target for the core.
- **The machinery stays in place, deprecated**: DESIGN-08, `ReplayVerifier`,
  envelope hashing (ADR-0024), the cross-process harness
  (`cross-process-test`), and the m1/m2 determinism acceptance registries.
  Removing or redesigning it is a later, separate effort — out of this map's
  scope.
- The research-04 determinism traps remain **advisory hygiene** where
  determinism still matters to shipped features (save/replay continuity and
  replay-based integrity checking), not hard gates: default `Random` (live
  `Math.random`), live `Clock`, fiber-ID leakage into records, `race`/`timeout`
  timing-dependence, unordered `HashMap`/`HashSet` iteration, Promise interop /
  op-budget yields (>2048 ops).

## Consequences on the map

- Beachhead (06): no longer needs to avoid the core nor prove "zero engine-hash
  change" — that criterion is removed.
- Sequencing (08): the "golden hashes unchanged / cross-process determinism"
  verification gates are replaced by the ADR-record rule.
- Handoff must carry a dedicated ADR recording this demotion (conflicts with
  DESIGN-08, normative), per the repo's authoritative-decision ADR rule.

## Rationale / authority

User direction at grilling (2026-08-16): maximum Effect value in the core;
golden-hash regeneration and the determinism approach explicitly not a
concern; "lift the gate only" confirmed — the machinery stays in place,
deprecated, for a later cleanup effort. This conflicts with DESIGN-08
(`docs/architecture/determinism-and-randomness.md`, normative) and the m1/m2
acceptance registries; the conflict is recorded here and flagged for a
dedicated ADR in the implementation-track handoff.