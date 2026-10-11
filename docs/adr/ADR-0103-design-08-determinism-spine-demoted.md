# ADR-0103: DESIGN-08 determinism spine demoted

## Status

Accepted (2026-10-11).

## Context

The Bluewave engineering contract and DESIGN-08 (determinism and randomness)
treat identical authoritative hashes across supported operating systems as a
**hard** requirement, enforced by golden-hash verification, the cross-process
determinism harness, envelope hashing, and the m1/m2 acceptance registries.

The Effect v4 adoption grilling (adoption ticket 05, human decision 2026-08-16)
reversed that posture: the full Effect idiom — runtime, fibers, clock, services
— is permitted in the authoritative engine core, and the golden-hash /
determinism verification spine was demoted from a gate to **deprecated
machinery**. This conflicts with the normative text of DESIGN-08, so the conflict
must be recorded as an ADR rather than left implicit.

## Decision

1. **The determinism wall is lifted.** No Effect construct is prohibited by the
   *determinism* policy in the authoritative engine core; maximum Effect value is
   the goal. This lifts the determinism gate **only** — it does **not** lift the
   runtime-usage boundary (ADR-0100 / MIG-RUNTIME-1), which still governs *where*
   a runtime is introduced (pure packages use the runtime-free subset; the full
   runtime belongs at IO/orchestration/entrypoint boundaries). The two decisions
   answer orthogonal questions: "must authoritative outputs be reproducible?"
   (this ADR: no longer a hard gate) versus "which layer may hold a runtime?"
   (ADR-0100: unchanged).
2. **Golden-hash and cross-process determinism are demoted from a hard gate to
   deprecated, informational machinery.** Drift is **recorded via an ADR note,
   never a blocker**. The harness keeps running so diffs still surface.
3. **The machinery stays in place.** DESIGN-08, `ReplayVerifier`, envelope hashing
   (ADR-0024), the `cross-process-test` harness, and the m1/m2 determinism
   acceptance registries are retained, deprecated; removing or redesigning them
   is a later, separate effort outside this migration.
4. **The DESIGN-08 named hierarchical random streams remain the RNG authority.**
   The `random` package's deterministic PRNG is **not** swapped for Effect
   `Random`; `Random` is a primitive, not a replacement. This keeps save/replay
   continuity and replay-based integrity checking meaningful.
5. **Determinism hygiene is advisory where shipped features depend on it** —
   default `Random` (live `Math.random`), live `Clock`, fiber-ID leakage into
   records, `race`/`timeout` timing dependence, unordered `HashMap`/`HashSet`
   iteration, Promise interop/op-budget yields — not a hard gate.
6. **Any change to a hash-surface output is recorded as an ADR note** (record, not
   block), per the canonical-artifact rule of the engineering contract.

## Consequences

- Wave gates no longer require "golden hashes unchanged / cross-process
  determinism"; the ADR-record rule replaces them.
- The adoption migration is not blocked by determinism drift, while the
  deprecated harness still provides informational signal.
- DESIGN-08 remains normative except on this point, where this ADR wins (see
  `docs/adr/AMENDMENTS.md`).
- Deferred cleanup of the deprecated machinery is tracked outside this ADR; it is
  deliberately not deleted.

## Alternatives considered

- **Keep the determinism gate as a hard blocker.** Rejected: it would stall the
  Effect migration and contradicts the human decision recorded in adoption
  ticket 05.
- **Delete the deprecated machinery now.** Rejected: out of scope and risky;
  keeping it running preserves informational value and a later cleanup seam.
- **Swap the `random` PRNG for Effect `Random`.** Rejected: dilutes the RNG
  authority and breaks DESIGN-08's named-stream ledger.
- **Record the hash-drift rule only in prose, without an ADR.** Rejected: the
  conflict with a normative DESIGN doc requires a durable decision record.
