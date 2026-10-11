# 07 — Campaign-file collections are in the artifact and consumed decoded at runtime

**Type:** implementation
**Status:** resolved
**Blocked by:** none (02 and 03 are resolved)
**Frontier:** no

## What to build

Close the remaining hole in the central invariant "validated content is the only
thing that runs." Today the artifact (`content:build` →
`buildFullSurfaceInput`) covers the content-pack collections
(rulesets/nations/areas/routes/possessions/ports/technologies) and the
ship-building catalogue, but **not** the campaign-file collections
(`fleets`/`economies`/`constructions`/`diplomacy`/`research`/`designs`). Those
six collections are:

1. **not validated by `content:check`/`content:build` at all**, and
2. **parsed from raw YAML at runtime** by `CampaignCompiler.compile`
   (`packages/campaign/src/compiler.ts:125` re-runs `ContentCompiler.compile`
   over the raw file paths, and `:142` calls `loadAllCampaignData` on raw paths).

So a pack that diverges from the artifact — or that `content:check` never saw —
can still execute through `runCompilation` / `compileProductionCampaign`
(`apps/desktop/src/main/compiler.ts`, used by `compileCampaign` and
`listNewGameOptions`). CRI-MAIN-2 is therefore only half-satisfied: month
execution and the recorded identity are artifact-derived, but the campaign
compile path is not.

Make the campaign-file collections first-class collections of the compiler that
flow through the **same** four stages (parse → validate → normalize → compile,
ADR-0004), carry them in the `ContentBundle`, and give `CampaignCompiler` a path
that consumes the already-decoded, already-verified bundle instead of
re-reading/re-parsing raw files. This is the "give `CampaignCompiler` a path
that consumes already-decoded collections" branch of the decision; it also
requires (1) so the collections are actually validated and present in the
artifact.

## Acceptance criteria

- [ ] `buildFullSurfaceInput` includes the six campaign-file collections, so
      `content:check`/`content:build` validate the **whole** authored surface
      (duplicate IDs and dangling cross-file references fail per collection).
- [ ] The `ContentBundle` carries the campaign-file collections (canonical,
      sorted, inert JSON); two consecutive builds over unchanged content stay
      byte-identical and the envelope body hash is stable.
- [ ] `CampaignCompiler` has a path that consumes already-decoded campaign-file
      collections (and the decoded content pack) from the verified artifact;
      `compileCampaign`/`listNewGameOptions` use it, so no campaign-file YAML is
      read or parsed at runtime.
- [ ] A source/integration test fails under the old behaviour: a campaign-file
      collection that diverges from the artifact cannot execute; a tampered
      artifact fails closed before month execution.
- [ ] The recorded content identity remains artifact-derived and content-derived
      (never weaker than today's file-bytes hash); a campaign-file change
      surfaces as an expected content update (`REPLAY_CONTENT_CHANGED`), not a
      divergence.
- [ ] Existing saves still load; the full orchestrator gate is green.

## Notes

- Extends ADR-0122 (artifact contract) and ADR-0123 (artifact-derived identity);
  the hash/identity surface may move and must be recorded via an ADR (per
  CRI-MAIN-3 / CRI-DET-2), never by weakening a golden expectation.
- Prefer one discovery path: `buildFullSurfaceInput` is already shared by the CLI
  and the build-time generator; extend it rather than adding a second pipeline.
- `CampaignCompiler` currently owns `ContentCompiler` internally; the decoded
  path should not re-compile the content-pack collections, it should accept the
  verified bundle's decoded pack + campaign collections.
- Grounds §1 of the content-runtime-integrity review: "validated content is the
  only thing that runs" is not yet true while this path parses raw content.
- Sizes: this is a vertical slice across `content-compiler` (collections +
  bundle), `campaign` (decoded consume path), desktop main (wire the artifact
  in), plus determinism/golden verification.

## Comments

**Resolved (2026-10-11).** The six campaign-file collections
(`fleets`/`economies`/`constructions`/`diplomacy`/`research`/`designs`) are now
first-class compiler collections carried in the artifact and consumed decoded at
runtime (ADR-0124, extending ADR-0122/ADR-0123).

- `CompilerInput` gained the six optional file groups; `buildFullSurfaceInput`
  discovers them from `pack.json`'s `files` map, so `content:check`/`content:build`
  validate the **whole** authored surface through the same four stages
  (parse → validate → normalize → compile). Validate duplicate-id checks each
  collection and rejects dangling nation / technology / design-version references
  with file + field path (`DUP-ID`, `REF`); Normalize sorts canonically.
- `ContentBundle.campaign` carries the six canonical arrays; it is **omitted** for
  content-pack-only inputs, so the `bwc compile` wire format and
  `canonicalSerialize` output stay byte-compatible.
- `CampaignCompilerInput` gained `contentBundle` (+ `contentHash`):
  `CampaignCompiler` consumes the already-decoded bundle's content pack and
  campaign collections and reads **no raw files**; the raw-input path is
  unchanged. The desktop `compileProductionCampaignFromArtifact` reads and
  verifies the artifact and `compileCampaign`/`listNewGameOptions` use it, so no
  campaign YAML is parsed at runtime; a tampered/missing artifact fails closed
  before month execution (`CONTENT_ARTIFACT_INVALID`).
- Identity stays artifact-derived: the decoded path records the verified manifest
  `bodyHash`, never raw file bytes; a campaign change is an expected
  `REPLAY_CONTENT_CHANGED`, not a divergence.
- `verifyContentBundleArtifact` now returns a typed `ContentBundle` (field-wise
  assertion, no new `as unknown` debt); `contentPackFromArtifact` hosts the one
  content-pack view assertion the compiler already had.

Tests: `content-compiler` +6 (`test/campaignCollections.test.ts`: bundle carry,
content-pack-only omission, duplicate id, dangling fleet→design ref, canonical
sort, discovery); `campaign` +3 (decoded path equals raw snapshot, divergent raw
campaign YAML ignored, missing-content fail-closed); `compiler-cli` content-surface
asserts the campaign coverage; desktop `contentArtifact.test.ts` +3 (bundle
carries campaign, artifact-derived identity, tampered artifact fails closed).
`pnpm preflight` green; content-compiler/campaign/compiler-cli suites green;
desktop 249 files / 1643 tests green.

