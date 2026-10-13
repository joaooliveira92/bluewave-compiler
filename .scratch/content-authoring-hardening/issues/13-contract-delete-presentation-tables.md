# 13: Contract — delete the duplicated presentation tables

**Type:** implementation
**Status:** resolved
**Blocked by:** 11 — Migrate nation-selection consumers to DTOs; 12 — Migrate world-map consumers to DTOs
**Frontier:** no

**What to build:** Once no consumer reads the renderer-side presentation tables,
delete them and their audit tests, so there is exactly one source of truth and one
content edit drives every screen.

## Acceptance criteria

- [ ] The renderer-side presentation tables and their audit tests are removed.
- [ ] No renderer module imports a removed table; a search/architecture check
      proves it.
- [ ] The renderer bundle still contains no parser/validation runtime.
- [ ] Every affected screen is unchanged; `pnpm snap` green, console clean.
- [ ] A presentation change is a single content edit (no second table to update).

## Resolution

- The renderer-side presentation tables are removed: `nationCoordinates.ts`,
  `nationFlavorText.ts`, `nationDossierFields.ts`, `area-regions.ts`, the
  marker-colours / `NATION_PRESENTATION_CATALOG` literals, the
  `NATION_ID_TO_COUNTRY_ID` table, and the `campaign-map-join.ts` join tables.
  Everything the player sees is read from the decoded corpus via
  `content/presentationContent.ts`.
- Their audit tests are removed (`presentation-sourcing.test.ts`,
  `area-regions.test.ts`, `campaign-map-coverage.test.ts`).
- `content/presentation-tables-removed.test.ts` is the architecture guard: it
  scans every renderer `.ts/.tsx` (tests excluded) and fails if any module
  imports a removed table module or reads a removed table identifier.
- The renderer bundle gains no parser/validation runtime (unchanged
  `content-boundary.test.ts` + `check-renderer-bundle.mjs`).
- A presentation change (a new area, a nation rename, a new nation) is a single
  edit to `content/production/1880/presentation.yaml`; no renderer table mirrors
  it.

Validation: `@bluewave/desktop` full renderer suite green; `pnpm snap` captured
for the affected screens (see ticket 11/12 runs).
