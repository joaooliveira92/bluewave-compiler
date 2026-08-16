# Ticket 06 — Beachhead Selection

**Type:** grilling
**Status:** resolved
**Blocked by:** 05-engine-core-effect-policy, 09-version-line-choice

## Question

Which package is the **first** to adopt Effect v4, and what must that beachhead
prove before wider adoption is unlocked? The engine-core wall is **lifted**
(ticket 05) — the beachhead may be an engine package, not just infra. Candidates
(now unconstrained by the wall): `@bluewave/diagnostics` (typed errors),
`@bluewave/persistence` (SaveStore / RecoveryManager / CompatibilityChecker —
async, error-heavy, envelope-hashed), `@bluewave/events`, `@bluewave/commands`,
and the desktop main process (async orchestration). Beachhead acceptance
criteria: demonstrates typed errors + Schema at a real boundary and follows the
official gradual-adoption on-ramp (one boundary-heavy service with Schema
first). The "zero engine-hash change" criterion is **removed** (ticket 05).

Work with the human via `/grilling` + `/domain-modeling`, zooming ticket 05's
answer.

## Answer

Beachhead: **`@bluewave/persistence`** — the `SaveStore` / `RecoveryManager` /
`CompatibilityChecker` / `snapshotSerialization` surface (human decision,
2026-08-16).

Acceptance bar (full on-ramp):

- Re-implement one boundary-heavy service with Effect: **tagged errors**
  replace the throw + `DiagnosticCollector` mix; **Effect Schema** validates the
  save boundary (metadata / sig / pointer / manifest, per
  `docs/contracts/schemas/SAVE-MANIFEST.md`).
- Save files **round-trip loadably** — empirically proving Effect `Data`/`Schema`
  values survive `canonicalSerialize` + envelope hashing (resolves the
  serializer-interplay fog patch).
- **Cancellation / rollback preserved** (AbortSignal, atomic tmp→rename→pointer,
  pointer rollback).
- **`PERSISTENCE_*` error-code vocabulary survives**, mapped onto tagged errors.
- Public `SaveStore` API stays compatible; tests green.
- Whether the `DiagnosticCollector` contract itself is replaced is decided
  later (error-model fog), not by the beachhead.

## Rationale / authority

`persistence` is IO-bound, error-heavy, has a Schema-shaped boundary, and owns
the envelope/serializer — so it proves the riskiest adoption facts (Effect
values surviving canonical serialization, saves staying loadable) in one
contained package that is upstream of the desktop app and on the hot path of
nothing.