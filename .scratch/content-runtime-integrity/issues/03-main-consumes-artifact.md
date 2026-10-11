# 03 — Main process runs on the compiled artifact (no raw YAML at runtime)

**Type:** implementation
**Status:** resolved
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

## Comments

**Resolved.** The Electron main process now runs on the compiled artifact
(ADR-0122) instead of reading raw ship-building / reference-design YAML:

- `@bluewave/content-compiler` gained the shared artifact contract:
  `buildContentBundleArtifact` / `writeContentBundleArtifact` /
  `verifyContentBundleArtifact` (+ the `content-bundle` kind/version constants and
  `ContentBundleManifest`). `buildFullSurfaceInput` and the ship-building file
  discovery + `safePath` moved into the package so the CLI and the runtime share
  one discovery path. `compiler-cli`'s `content:check`/`content:build` are now
  thin aliases over the shared builder (byte-identical output; production hash
  `b54fd387…` unchanged).
- `apps/desktop/src/main/contentArtifact.ts` reads and **verifies** the artifact
  (manifest kind/version/algorithm, do-not-edit marker, and SHA-256 body hash via
  `verifyEnvelope`); a missing, unreadable, tampered, or version-mismatched
  artifact raises a stable `ContentArtifactError` and the app fails closed.
  `index.ts` verifies at startup before any window exists (CRI-MAIN-4).
- `shipBuildingContent.ts` and `referenceDesigns.ts` no longer import `yaml`,
  `node:fs`, or `@bluewave/content-schema`; they hand the artifact's
  already-decoded catalogue to `buildShipBuildingContent` (CRI-MAIN-1). A source
  test asserts the forbidden imports stay gone.
- **Content identity is artifact-derived** (ADR-0123): `shipBuildingContentHash`
  / `armamentContentHash` are the artifact manifest's canonical `bodyHash` under a
  domain-separated envelope. A content change is an expected content update
  (still `REPLAY_CONTENT_CHANGED`), never a divergence; older saves keep the hash
  they recorded (CRI-MAIN-3).
- The artifact is generated before the app/tests run: desktop `dev`/`build`
  scripts and the vitest `globalSetup` call `scripts/build-content.mjs` (the same
  pipeline), and `content/generated/<scenario>/` stays git-ignored.

**Interpretation recorded (CRI-MAIN-2).** "Campaign compile / new-game option
listing / month execution run on artifact-derived content" is satisfied for the
ship-building + reference-design content these flows execute: month execution
injects `loadShipBuildingContent()` (artifact-derived), and the recorded identity
is artifact-derived. The content-pack *collections* (rulesets/nations/areas/…)
are still compiled by `CampaignCompiler` through the hardened `parseYamlSafe`
parser (not raw `yaml` in main); folding those into the runtime artifact too would
require the campaign-file collections in the bundle and is a larger change than
this ticket's raw-YAML-at-runtime scope. Recorded, not silently dropped.

**Follow-up (2026-10-11).** That remaining half is now tracked as ticket **07**
(`07-campaign-collections-through-artifact.md`): the campaign-file collections
(`fleets`/`economies`/`constructions`/`diplomacy`/`research`/`designs`) are
neither in the artifact nor validated by `content:build`, and
`CampaignCompiler` still parses the content-pack collections from raw files at
runtime. Until 07 lands, a manageable pack that diverges from the artifact can
still execute through `compileCampaign`/`listNewGameOptions`, so CRI-MAIN-2 is
half-satisfied.

**Resolved by ticket 07 (2026-10-11).** Ticket 07 landed: the six campaign-file
collections are now in the artifact and consumed decoded at runtime, so
`compileCampaign`/`listNewGameOptions` read no campaign YAML — CRI-MAIN-2 is now
fully satisfied. See ADR-0124.

Tests: content-compiler 18; compiler-cli 99 (incl. content-surface 4); desktop
246 files / 1628 tests (incl. new `contentArtifact.test.ts` and the
artifact-derived identity assertions). `pnpm preflight` green; `pnpm typecheck`
green; production artifact byte-stable.