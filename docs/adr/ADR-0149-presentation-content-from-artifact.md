# ADR-0149: Presentation content sourced from the compiled artifact

## Status

Accepted (2026-10-13).

## Context

The nation-facing presentation corpus — nation coordinates, flavor text, dossier
fields, the nation-id → country-id slot mapping, the area → region grouping and
the campaign-map join — lived as hand-authored renderer tables
(`nationCoordinates.ts`, `nationFlavorText.ts`, `nationDossierFields.ts`,
`nationPresentationCatalog.ts`, `nationSlotMapping.ts`, `area-regions.ts`,
`campaign-map-join.ts`). Tests *audited* those tables against the compiled
content, but nothing *derived* them from it, so a content change required two
edits in two trees and the "single source of truth" claim did not hold for what
the player actually sees.

ADR-0125 had already built the narrow content IPC and the injectable-seam
pattern for the drawing board. The presentation corpus is the same shape of
problem: pure presentation data the renderer should receive decoded, never parse.

## Decision

1. **The presentation corpus is authored pack content.** `presentation.yaml` is
   declared in the pack manifest and compiled into the artifact as an optional
   `presentation` section (schema `PresentationContentSchema`), preserving
   authored nation-slot and region display order. The content compiler
   **validates it against the compiled content**: when a pack carries areas,
   every area must have a display region and a fixture mapping, with no stale
   keys, and every named region must be declared and used; when it carries
   countries, every country must have a home-waters area naming a known area. A
   new area or nation therefore cannot silently miss a region, vanish from the
   map, or leave the renderer to guess — the pack fails to compile until the
   corpus covers it.
2. **Main serves it as a data-only DTO over the existing narrow content IPC.**
   `inspectPresentationContent` returns `PresentationContentDto` decoded from the
   verified artifact. No file path, generic file read, or parser is exposed
   (ADR-0008, ADR-0105).
3. **The renderer reads the DTO through an injectable seam.** The app fetches the
   DTO once (`usePresentationContentSource`) and injects it
   (`presentationContent.ts`); screens read synchronous accessors from the seam.
   Renderer tests seed the same seam from the compiled artifact in the vitest
   setup, so no renderer test imports a presentation table. The hand-authored
   renderer tables and their audit tests are deleted; an architecture guard fails
   if any renderer module imports a removed table.
4. **Geo assets stay baked generators.** Only the authored presentation data
   moves; baked borders/coastline and the media-asset manifest remain
   renderer-side (ADR-0003), so the boundary test's `bake-*` exclusion holds.

## Consequences

- A presentation change (a new area, a nation rename, a new nation) is a single
  edit to `presentation.yaml`; the renderer has no second table to update.
- The renderer bundle still contains no parser or validation runtime; the
  content boundary and bundle tripwire are unchanged.
- The artifact body hash moved once, when the corpus was first compiled in; the
  committed content lock (ADR-0145) records the new identity, and the corpus is
  presentation-only, never authoritative simulation state (ADR-0003).
- The compiler now fails a pack whose presentation corpus does not cover its
  areas/countries, so the invariant is enforced at compile time, not by a
  renderer audit.

## Related

- ADR-0003 (presentation never authoritative), ADR-0105 (content-schema Effect
  boundary), ADR-0122 (compiled content bundle), ADR-0125 (renderer content IPC),
  ADR-0145 (committed content lock).
- `.scratch/content-authoring-hardening/spec.md` (CAH-PRES-1..5),
  tickets 10–13.
