# ADR-0123: Content identity derives from the compiled artifact

## Status

Accepted (2026-10-11).

## Context

Months and saves already record a content identity so a replay can tell a content
update from a real divergence. Today the main process computes two hashes from
**raw authored file bytes** keyed by relative path:
`shipBuildingContentHash` over the ship-building files (ADR-0109) and
`armamentContentHash` over the armament files (ADR-0093 Step 3).

ADR-0122 introduced one deterministic, hash-pinned compiled artifact for the
whole authored surface (`content-artifact.json` + `content-manifest.json`). Once
the main process runs on that artifact, the recorded identity must describe
**exactly the content the compiler validated**, not a separate re-reading of the
same files — otherwise "what CI proved" and "what the app recorded" could drift.

## Decision

### 1. The recorded identity is artifact-derived and domain-separated

`shipBuildingContentHash()` and `armamentContentHash()` are derived from the
artifact manifest's canonical `bodyHash` under a domain-separated envelope
(`hashWithContext`, ADR-0003):

- `shipBuildingContentHash = hashWithContext(manifest.bodyHash, "ship-building-content")`
- `armamentContentHash = hashWithContext(manifest.bodyHash, "armament-content")`

Both remain 64-hex, deterministic across processes, content-derived, and
tamper-evident: any change to the compiled bundle changes `bodyHash` and
therefore both identities. They stay **distinct fields** so older saves keep
their existing recorded shape (the armament field is optional on pre-cut-over
saves).

### 2. A content change is an expected content update, never a divergence

A change to the compiled bundle produces new identities and surfaces through
replay verification as `REPLAY_CONTENT_CHANGED` (an expected content update),
exactly as the ADR-0109 file-set change did. It is never treated as a
nondeterminism failure, and no test is weakened to accommodate it. The
replay-divergence contract is preserved: the identity is still content-derived
and tamper-evident, never a constant or a weaker projection.

### 3. The runtime fails closed on an artifact that is absent or tampered

The main process verifies the artifact (manifest kind/version/algorithm,
do-not-edit marker, and SHA-256 body hash) at startup. A missing, unreadable, or
tampered artifact raises a stable `ContentArtifactError` and the app fails closed
— it never silently falls back to raw, unvalidated YAML.

## Consequences

- The content identity a month or save records is exactly the artifact CI
  validated; there is one content pipeline, not two.
- Existing saves still load; their recorded identities simply no longer match the
  current artifact, which reads as a content update.
- The compiled artifact must exist before the app or its tests start. It is
  produced by `content:build` and by the desktop build/dev scripts and test
  global setup; it is never committed (ADR-0122 §4).
- This amends the identity semantics of ADR-0093 (armament hash) and ADR-0109
  (ship-building file-set hash) without changing the replay contract.

## References

- ADR-0003 (canonical serialization and hashing)
- ADR-0093 (first-class armament content)
- ADR-0109 (ship-building content per nation)
- ADR-0122 (compiled content bundle)

## Amendments

- **2026-10-11 — campaign-file collections (`ADR-0124`).** The bundle now also
  carries the six campaign-file collections, so `bodyHash` (and therefore both
  recorded identities) moved: an expected content update, never a determinism
  failure. The identity remains artifact-derived and content-derived; older saves
  keep the identities they recorded.
