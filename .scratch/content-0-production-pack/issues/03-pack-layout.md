# CONTENT-0 — 03: Production pack layout and module placement

## Question

Where does the production content pack live in the repo, how is it structured,
and how does it relate to the existing dev/fixture packs? The pack manifest
must declare production vs fixture classification (DESIGN-05, ENGINEERING-
CONTRACT "Content" section); the CLI default content dir is `content/` and the
desktop/compiler flow reads pack.json + YAML collection files from a content
dir. This decision fixes the codebase layout that every content sprint authors
into.

## Type

research

## Status

resolved

## Notes

- `apps/compiler-cli/src/main.ts` defaults `contentDir = "content"` and reads a
  `pack.json` manifest plus rulesets/countries/areas/routes/possessions/ports/
  technologies YAML; campaign compiler additionally reads fleets/economies/
  constructions/diplomacy/research/designs.
- `@bluewave/content-schema` `PackManifestSchema.type` is
  `production | fixture | mod`.
- ENGINEERING-CONTRACT Content: production pack separately authored, validated,
  and explicitly classified; fixtures stay non-production.
- Existing fixture content is inline in test files (no on-disk content pack yet).

## Blocked by

01

## Answer

**Layout: top-level `content/production/<pack>/`, one subdirectory per
production pack, `type: "production"` in pack.json, all collection YAML
enumerated in `manifest.files`.** For the anchor pack:
`content/production/1880/` (contentDir for `scen_1880`). Files: pack.json +
rulesets, countries, areas, routes, possessions, ports, technologies +
campaign-side fleets, economies, constructions, diplomacy, research, designs.

Grounds (research §1, §5): the compiler takes `--content-dir` (default
`content`) and resolves every `files` entry relative to it; desktop reads
`<contentDir>/pack.json`. No auto-discovery; everything enumerated. This gives
**zero compiler changes**, reuses the CLI `content` root token, and keeps
production structurally separate from inline test fixtures (ADR-0006:36-38
fixture-first split). `PackManifestSchema.type` = `production|fixture|mod`.

Note: campaign-side collections are consumed by the desktop compiler today,
not the CLI `campaign:compile` (which passes empty arrays); a fully populated
production pack compiles via the desktop path until the CLI gap closes.

Sources: `docs/adr/ADR-0006-campaign-architecture.md:36-38`; `apps/compiler-cli/src/commands.ts:221-233,540-588`;
`apps/desktop/src/main/compiler.ts:33,49-63`; `packages/campaign/src/compiler.ts:35-42,118-147`;
`packages/content-schema/src/manifest.ts:6`; `docs/research/content-0-pack-layout-classification.md`.
