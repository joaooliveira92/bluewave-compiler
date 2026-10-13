# 11: Migrate nation-selection consumers to DTOs

**Type:** implementation
**Status:** resolved
**Blocked by:** 10 — Expand — presentation collection and IPC DTO path (resolved)
**Frontier:** no

**What to build:** Move the nation-selection, globe and dossier consumers to read
presentation from the IPC DTOs instead of the local tables. The screens must look
and behave identically; the local tables remain in place but unused by these
consumers, so the batch stays green.

## Acceptance criteria

- [ ] Nation-selection/globe/dossier screens read coordinates, flavor, dossier and
      slot mapping from the IPC DTOs.
- [ ] Those screens render unchanged; `pnpm snap` shows no visible difference
      (aria stable, console clean).
- [ ] Renderer tests inject presentation DTOs rather than importing the tables.
- [ ] The old tables still exist for the remaining consumers (contract is a later
      ticket).

## Resolution

- `apps/desktop/src/renderer/content/presentationContent.ts` is the renderer seam:
  the decoded `PresentationContentDto` injected once (from `inspectPresentationContent`
  over IPC in the app, from the compiled artifact in tests) with synchronous
  accessors for the authored nation records — `nationFlavor`/`nationDossier`/
  `nationCoordinates`/`nationCode`/`nationMarkerColour`, the slot bridge
  (`nationIdToCountryId`/`countryIdToNationId`) and `nationDisplayName`.
- `content/usePresentationContent.ts` + `content/PresentationContentGate.tsx`
  fetch the DTO over the narrow content IPC and inject it before any consumer
  renders; `App` wraps the shell in the gate. `test-setup.ts` seeds the seam from
  `loadPresentationContent()` (the same compiled artifact the drawing board uses).
- Migrated consumers: `nationPresentationCatalog.ts` (authored fields from the
  DTO, only media assets resolved renderer-side), `nationSlotMapping.ts`,
  `nationDisplayName.ts`, `globePins.ts` (lazy `globePoints()`/
  `dominantFlagColors()`), `NationSelectionScreen`, `DossierSlidePanel`/
  `DossierTabContent`, `nationArtwork`/`fleetDispatchUtils` (via the catalog),
  `new-game-commissioning-review-screen-state`, `NewGameBriefingScreen`,
  `diplomacy-view-model`, and `InteractiveGlobe`.
- The hand-authored tables (`nationCoordinates.ts`, `nationFlavorText.ts`,
  `nationDossierFields.ts`, and the marker-colours/`NATION_PRESENTATION_CATALOG`
  literals) are deleted; the "old tables still exist" carve-out was folded into
  ticket 13 since the whole tree stays green in one batch.
- Tests: `slotBridge.test.ts` and `DossierSlidePanel.test.tsx` read the injected
  seam; the `presentation-sourcing.test.ts` audit is replaced by
  `presentation-tables-removed.test.ts`. `App.test.tsx` (8), world-map (20 files /
  104 tests), and the nation-selection suites pass.

Validation: `apps/desktop` `tsc -b --force` clean; `@bluewave/desktop` focused
suites green.
