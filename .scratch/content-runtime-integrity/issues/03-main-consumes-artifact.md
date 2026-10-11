# 03 — Main process runs on the compiled artifact (no raw YAML at runtime)

**Type:** implementation
**Status:** open
**Blocked by:** 02
**Frontier:** no

## What to build

The Electron main process loads ship-building content, reference designs, and
campaign content from the compiled artifact instead of reading and parsing raw
YAML. The content hash that months and saves record derives from the artifact,
so replay-divergence detection is preserved: a content update is still
distinguishable from a real divergence.

At startup the app verifies the artifact's recorded content version/hash and
fails with an explicit, actionable error on mismatch rather than silently running
content that was never validated.

This is the consumer half of "validated content is the only thing that runs":
what CI proved is now exactly what executes.

## Acceptance criteria

- [ ] No raw ship-building or reference-design YAML is read in the main process
      at runtime.
- [ ] Campaign compile, new-game option listing, and month execution run on
      artifact-derived content.
- [ ] The recorded content hash is artifact-derived; a content change surfaces as
      an expected content update (not a determinism failure), with golden/replay
      expectations updated or recorded via an ADR.
- [ ] A version/hash mismatch at startup produces an explicit error, not a silent
      fallback.
- [ ] Existing saves still load; `pnpm check` is green.

## Notes

- Grounds on the per-nation content ADR (content hash semantics) and the
  save-integrity ADRs.
- Preserve the replay-divergence contract: never reduce the recorded identity to
  something weaker than today's file-bytes hash.
- Runtime-free validation stays in the schema package; main consumes already
  decoded/normalized artifact data.