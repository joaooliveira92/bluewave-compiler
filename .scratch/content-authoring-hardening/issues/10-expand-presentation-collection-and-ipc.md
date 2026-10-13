# 10: Expand — presentation collection and IPC DTO path

**Type:** implementation
**Status:** resolved
**Blocked by:** 01 — Manifest authority for the loaded surface; 07 — Decode the verified bundle at the artifact boundary
**Frontier:** no

**What to build:** Add the presentation corpus as authored pack content and serve
it over the existing narrow content IPC, without removing the renderer's current
tables. Nation coordinates, flavor text, dossier fields and the
nation-id→country-id slot mapping become a compiled collection; the area→region
grouping and the campaign-map join become authored content (or are derived from
it). Main serves the decoded presentation DTOs over the existing content
capability. Nothing consumes the DTOs yet, so no screen changes.

## Acceptance criteria

- [ ] The presentation collections are declared in the manifest and compiled into
      the artifact.
- [ ] Main serves presentation DTOs over the existing content IPC; no filesystem,
      path or generic-read capability is exposed.
- [ ] The renderer bundle gains no parser or validation runtime.
- [ ] The existing renderer tables still drive the screens (nothing breaks);
      `pnpm snap` is unchanged.
- [ ] A source/boundary test proves the served DTOs are the authored content.

## Resolution

- `@bluewave/content-schema`: new `presentation.ts` defines
  `PresentationContentSchema` (nation records with coordinates/flavor/dossier,
  the area→region grouping and the campaign-map join) with an optional
  `provenance` field, exported through the package index and added as an
  optional `presentation` section of `ContentBundleSchema`
  (`packages/content-schema/test/presentation.test.ts`, 6 tests).
- `content/production/1880/presentation.yaml` (495 lines) authors the corpus; it
  is declared under `files.presentation` in `pack.json`. Generated from the
  existing renderer tables and verified byte-for-value equal to them by
  `apps/desktop/src/renderer/content/presentation-sourcing.test.ts` (the audit
  test ticket 13 removes).
- `@bluewave/content-compiler`: `presentationFiles` on `CompilerInput`, an
  object-group parse (with tracked source paths), strict validate, deterministic
  normalize (nations by `countryId`, regions by `id`) and compile-into-bundle,
  plus `toMutableBundle` reconstruction
  (`packages/content-compiler/test/presentationCollection.test.ts`, 4 tests).
- Desktop main: `presentationContent.ts` decodes the presentation corpus from
  the verified artifact; the `inspectPresentationContent` command serves it over
  the existing `campaign:execute` content IPC as a data-only DTO
  (`apps/desktop/src/shared/content-contract.ts`,
  `apps/desktop/src/main/commands/contentCommands.ts`). No filesystem, path or
  generic-read capability is added.
  `apps/desktop/src/main/presentationContent.test.ts` proves the served DTO is
  the authored content.
- The artifact body hash moved (a deliberate content addition); the committed
  `content-lock.json` was refreshed to
  `576706c9e5102037a69382bdf55326dadbf4d18ce2dac2c50b99d5ad36cd5669`.
- The presentation corpus keeps its authored array order (nation slot order and
  region display order are meaningful, like the reference-design discovery
  order); `canonicalSerialize` still sorts the record keys, so the body hash is
  reproducible by rule (CAH-DET-1).
- Nothing consumes the DTOs yet, so the screens are unchanged; the renderer
  tables still drive them and the renderer bundle gains no parser.

Validation: `pnpm preflight` green (17 gates, including content lock verify and
`no-new-unknown-casts`); `@bluewave/content-schema` 71 tests,
`@bluewave/content-compiler` 82 tests, `@bluewave/compiler-cli` 109 tests,
`@bluewave/desktop` 290 passed/1 skipped. The two failures in the full suite
(`packages/ship-visual/test/place.test.ts` and the unclassified
`@bluewave/ship-visual` package in `cross-process-test`'s `package-graph`) are
pre-existing in unrelated in-progress work on the tree, not this ticket.

