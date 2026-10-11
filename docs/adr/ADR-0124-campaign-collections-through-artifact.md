# ADR-0124: Campaign-file collections are compiled into the artifact and consumed decoded at runtime

## Status

Accepted (2026-10-11).

## Context

ADR-0122 compiled the content-pack collections and the ship-building catalogue
into one hash-pinned bundle, and ADR-0123 made the recorded content identity
artifact-derived. But the six **campaign-file** collections
(`fleets`/`economies`/`constructions`/`diplomacy`/`research`/`designs`) stayed
outside the artifact: `content:check`/`content:build` never validated them, and
`CampaignCompiler.compile` re-ran `ContentCompiler.compile` over the raw content
pack and `loadAllCampaignData` over the raw campaign YAML at runtime
(`packages/campaign/src/compiler.ts`). A manageable pack that diverged from the
artifact could therefore still execute through `compileCampaign` /
`listNewGameOptions`, so "validated content is the only thing that runs" was only
half true.

## Decision

### 1. The six campaign-file collections are first-class compiler collections

`CompilerInput` gains optional file groups (`fleetFiles`, `economyFiles`,
`constructionFiles`, `diplomacyFiles`, `researchFiles`, `designFiles`), populated
by `buildFullSurfaceInput` from the `pack.json` `files` map. They flow through the
**same four stages** as everything else (ADR-0004): Parse reads each file through
`parseYamlSafe`; Validate duplicate-id checks each collection (by `id`,
`nationId`, or `designId` as appropriate) and rejects dangling cross-file
references (unknown nation, unknown technology, unknown design version) with the
source file and field path in the diagnostic (`DUP-ID`, `REF`); Normalize sorts
canonically (entity collections by `id`, per-nation collections by `nationId`).

### 2. The bundle carries a `campaign` section

`ContentBundle.campaign` holds the six canonical, sorted, inert arrays. It is
**omitted** when the input carried no campaign content, so the content-pack-only
`bwc compile` wire format and `canonicalSerialize` output stay byte-compatible
(§ADR-0122.5).

### 3. `CampaignCompiler` has a decoded path

`CampaignCompilerInput` gains an optional `contentBundle` (+ `contentHash`). When
present, the compiler reads the content-pack collections and the campaign-file
collections directly from the bundle and reads **no raw files**; when absent it
keeps the existing raw-input path unchanged. The desktop
`compileProductionCampaignFromArtifact` reads and verifies the artifact
(`readContentArtifact`) and hands the bundle to this path; `compileCampaign` and
`listNewGameOptions` use it, so no campaign YAML is parsed at runtime (ADR-0099
packaged resource resolution: a tampered or missing artifact fails closed).

### 4. Identity stays artifact-derived

The decoded path records `contentHash` as the verified manifest `bodyHash` (the
canonical bundle hash), never the raw file bytes. A campaign-file change produces
a new artifact hash and is an **expected content update** (`REPLAY_CONTENT_CHANGED`
for months), not a nondeterminism failure. Older saves keep the hash they
recorded.

## Consequences

- The remaining hole in the central invariant is closed: the artifact is the
  single thing CI validated and the single thing the runtime compiles campaigns
  from.
- `buildFullSurfaceInput` now discovers the campaign collections from `pack.json`;
  the raw production tree is still shipped for the packaged build only until the
  same pipeline covers any remaining raw reads.
- Adding the collections changes the bundle body hash (an expected content
  update). Any golden/replay movement is recorded, never accommodated by
  weakening a test.
- No new package is introduced; the seam is the existing compiler + bundle.

## References

- ADR-0004 (compiler stage architecture)
- ADR-0122 (compiled content bundle)
- ADR-0123 (content identity artifact-derived)
- ADR-0099 (release verification gates; packaged resource resolution)
- ADR-0109 (ship-building content per nation)
