# 14: Retire dead paths

**Type:** implementation
**Status:** deferred
**Blocked by:** None (can start immediately)
**Frontier:** no

**What to build:** Remove the dead content CLI flag and the legacy raw-input
compile path. The `--content-version` flag is parsed but unused by the content
commands; remove it (or wire it deliberately, recording the reason). The legacy
raw-input compile path is removed once its last caller is migrated to the artifact
path.

## Acceptance criteria

- [ ] The unused `--content-version` flag is removed from the content commands (or
      deliberately wired, with the reason recorded).
- [ ] The last caller of the legacy raw-input compile path is migrated to the
      artifact path.
- [ ] The legacy raw-input compile path is deleted.
- [ ] No runtime YAML is read by the campaign compile path.
- [ ] Existing saves and campaign compile tests stay green.

## Resolution — partially landed; full deletion deferred

Landed:

- **`--content-version` is deliberately retained for `battle:generate` only**, with
  the reason recorded at its parse site (`apps/compiler-cli/src/options.ts`). The
  content commands derive the version from the pack manifest, so the flag is not
  part of their surface.
- **The CLI campaign compile now uses the decoded-bundle path.** `runCampaignCompile`
  builds the verified content bundle (`buildContentBundleArtifact`) and passes
  `contentBundle` + the artifact-derived `contentHash` to `CampaignCompiler`, so
  the production CLI campaign compile reads no raw campaign YAML. `buildCampaignFiles`
  was deleted as dead once the CLI stopped calling it.
- **The production runtime campaign compile reads no YAML** — the desktop main
  already compiles from the verified artifact (`compileProductionCampaignFromArtifact`,
  ticket 07).

Deferred (recorded, not dropped): **deleting `CampaignCompiler`'s raw-input branch**
(`compilerInput` + `campaignFiles`). Callers remain — the desktop misc-test
helpers (`compileProductionCampaign`, `runCompilation`), `researchDeterminismChild`,
the `@bluewave/cross-process-test` children, and the `@bluewave/campaign` package
tests all drive it directly. The branch is now test/cross-process-only
infrastructure; removing it is a test-migration follow-up, not a runtime path.

Validation: `pnpm preflight` green; `@bluewave/compiler-cli` 108 tests green
(including the updated `runCampaignCompile` assertions that the request carries
`contentBundle` and neither `campaignFiles` nor `compilerInput`).

