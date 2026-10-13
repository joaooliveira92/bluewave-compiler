# 12: Migrate world-map consumers to DTOs

**Type:** implementation
**Status:** resolved
**Blocked by:** 10 — Expand — presentation collection and IPC DTO path (resolved)
**Frontier:** no

**What to build:** Move the area tree and campaign map to read the region grouping
and map-join data from the IPC DTOs instead of the local tables. A new area that
has no region cannot silently fall into a catch-all; the screens render unchanged.

## Acceptance criteria

- [ ] The area tree and campaign map read region/join data from the IPC DTOs.
- [ ] An area without a region fails a check (or is reported), not silently
      grouped.
- [ ] The screens render unchanged; `pnpm snap` shows no visible difference.
- [ ] The old tables still exist for any remaining consumer (contract is a later
      ticket).

## Resolution

- The area → region grouping and the campaign-map join now come from the
  decoded presentation corpus: `area-tree.ts` reads `presentationRegions()` /
  `areaRegion()`; `campaign-map-join.ts`, `world-map-source.ts`,
  `useWorldMapModel.ts`, `WorldMapPanel`, `OverviewScreen`, `MonthReportCard`
  and `NationSwatch` read `fixtureAreaId` / `campaignNationHue` /
  `campaignNationLabel` / `nationHomeArea` from `presentationContent.ts`. The
  literal tables (`AREA_REGION`, `REGIONS`, `CAMPAIGN_AREA_TO_FIXTURE`,
  `NATION_HUE`, `NATION_LABEL`, `NATION_HOME_AREA`) and `area-regions.ts` are
  deleted; `campaign-map-join.ts` keeps only the pure join functions.
- An area without a region can no longer fall silently into a catch-all:
  `@bluewave/content-compiler`'s validate stage runs `validatePresentationRegions`,
  which **fails** the pack (`PRESENTATION_REGION`, naming the area and
  `presentation.yaml`) when a compiled area has no `areaRegion` entry or no
  `campaignAreaToFixture` mapping, when either table carries a stale key, when a
  region names an undeclared region, or when a declared region holds no area; and
  it fails a pack whose compiled nation has no home-waters area or names an
  unknown area. This restores the guarantee the deleted renderer audits
  (`area-regions.test.ts`, `campaign-map-coverage.test.ts`, the `NATION_HOME_AREA`
  block) provided, now enforced at compile time
  (`packages/content-compiler/test/presentationCollection.test.ts`, 3 tests; the
  production corpus is complete so it compiles unchanged). The renderer keeps the
  "Other waters" fallback only for fixture-mode rows.
- Tests: `campaign-map-join.test.ts` rewritten over the injected corpus;
  `area-regions.test.ts` and `campaign-map-coverage.test.ts` (renderer audits) are
  replaced by the compiler gate. `area-tree.test.ts`,
  `useInitialFocusArea.test.ts` and `WorldMapChart.test.tsx` stay green.

Validation: world-map suite 20 files / 104 tests green; `@bluewave/content-compiler`
`presentationCollection.test.ts` 6 tests green.
