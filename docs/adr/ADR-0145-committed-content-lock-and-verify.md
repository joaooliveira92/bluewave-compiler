# ADR-0145: A committed content lock and `content:verify`

## Status

Accepted (2026-10-12).

## Context

ADR-0122 deliberately keeps the generated content artifact out of git
(`content/generated/<scenario>/` is ignored): the artifact is rebuilt from
authored YAML rather than committed, so it cannot become a hand-edited second
source of truth. But that left nothing pinning the exact bytes CI validated
against the bytes a later machine builds: a content edit, a compiler change or a
tamper could produce a different artifact with no gate noticing.

## Decision

1. **A small committed lock records the artifact identity.** Each scenario carries
   `content-lock.json` with the semantic `contentVersion`, the `algorithm` and
   the SHA-256 `bodyHash` of the compiled bundle. The large artifact stays
   git-ignored; only the lock is committed.
2. **`content:verify` rebuilds and compares.** The CLI rebuilds the whole
   authored surface in memory (via the same `buildFullSurfaceInput` /
   `buildContentBundleArtifact` path as `content:build`) and verifies it against
   the lock. A divergence — content drift or a tampered lock — fails closed with
   the stable code `CONTENT-LOCK`, naming both hashes. `verifyContentLock` is a
   pure function in `@bluewave/content-compiler` so the comparison is tested
   without the CLI.
3. **The lock is part of the gate.** `pnpm content:verify` joins `pnpm check`
   after build, and `quality.yml` runs it right after `pnpm content:build`, so a
   stale or tampered artifact fails locally exactly as it would in CI
   (check↔CI parity, ADR-0140).

A content update is an **expected new lock**, never a divergence: a
content-changing commit refreshes `content-lock.json` deliberately.

## Consequences

- CI and a later machine can tell whether the artifact a build produced is the
  one CI validated, without committing the artifact.
- A content change that forgets to refresh the lock fails the gate with the two
  hashes named.
- Determinism (ADR-0007/0106) remains proven separately by the golden and
  cross-process checks; the lock pins identity, not reproducibility.

## Related

- ADR-0122 (compiled content bundle), ADR-0123 (content identity is
  artifact-derived), ADR-0106 (frozen-quality ratchets), ADR-0140 (check↔CI
  parity).
