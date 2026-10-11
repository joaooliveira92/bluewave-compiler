# ADR-0109: Ship-building content is split per nation

## Status

Accepted (2026-10-11).

## Context

The national ship-building content had grown into two monoliths:
`content/production/1880/ship-building/naval-profiles.yaml` (~3,200 lines) and
`reference-designs.yaml` (~8,200 lines). Adding or editing one nation meant
editing a huge file; review diffs were unreadable; and the two files interleaved
all nations, so there was no per-nation unit.

## Decision

1. **One file per nation for naval profiles:** `ship-building/naval-profiles/<nation>.yaml`,
   each `{ navalProfiles: [ … ] }`.
2. **One directory per nation for reference designs:** `ship-building/reference-designs/<nation>/starters.yaml`
   (designs with a `starterFor`) and `historical.yaml` (the rest), each `{ designs: [ … ] }`.
3. **Loaders read the directories, not a manifest.** Node loaders (`earlyContext.ts`,
   the phase-engine test helper, the desktop main loader) walk the directory with
   `readdirSync(...).sort()`; the desktop renderer uses `import.meta.glob`. There is
   no index file: adding a nation is one new file and nothing else. Ordering within a
   file is preserved; cross-file order is not significant because no two starters share
   a type and month (the `starterFor` tie-break never fires).
4. **The content hash covers the per-nation files.** `shipBuildingContentHash`
   (`apps/desktop/src/main/shipBuildingContent.ts`) now hashes every ship-building
   content file keyed by its relative path, still deterministically. Older saves keep
   their recorded hash; a new save records the new one, so a replay can tell a content
   update from a divergence.

## Alternatives considered

- **Generate the two monoliths from per-nation sources (a sync gate).** Rejected: the
  long files would still exist and the reviewer's complaint stands; a generated
  artifact also adds a gate and a drift surface.
- **An `index.yaml` manifest listing the files.** Rejected as unnecessary: directory
  order is deterministic under `sort()`, and the order is insignificant, so a manifest
  is one more file to maintain for no behavioural gain.
- **Split by kind across all nations (all starters together, all historical together).**
  Rejected: it does not give a per-nation unit, which is the point.

## Consequences

- Adding a nation is: one `naval-profiles/<id>.yaml`, one `reference-designs/<id>/starters.yaml`
  (and optionally `historical.yaml`), plus the classification map.
- ~20 test and app readers were updated to load the directories; the completeness,
  coverage, armament, phase-engine and desktop suites cover the new layout.
- `shipBuildingContentHash` changes value (the file set changed) — an expected content
  update, not a determinism regression; the cross-process golden and the determinism
  suites pass unchanged.
