# 02 — Crash / error observability

**Type:** decision + implementation
**Status:** open
**Blocked by:** none
**Frontier:** yes
**Spec:** `.scratch/release-readiness/spec.md`

## Scope

Decide whether the shipped desktop app reports failures, and if so how — offline and
single-player, so privacy and consent matter. Minimum: uncaught exception/rejection
handling in main + renderer that writes a local, user-visible support bundle, with an
explicit opt-in for any network reporting.

## Acceptance

- A decision (ADR) on local-only vs opt-in reporting, with the privacy stance stated.
- Main and renderer install global handlers that never hide a failure silently.
- A "save a support bundle" path the user can share; verified by a test that forces a
  crash and asserts the bundle is produced.
- No network call without explicit consent.

## Out of scope

- A hosted crash service. This decides the policy and wires local capture.
