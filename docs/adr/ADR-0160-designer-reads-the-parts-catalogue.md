# ADR-0160: The designer reads the parts-derived catalogue; the compile engine keeps the runtime catalogue until 17c

## Status

Accepted (2026-10-14). Extends ADR-0154 (the part model) and ADR-0157 (torpedoes as
parts). Ticket ship-part-model 17b-2.

## Context

ADR-0154 made the compiled **part model** authoritative for the ship-building content.
Ticket 11d built the parts barrier (`compileDesignFromLoadout`), and ticket 17a routed
the desktop design commands and the engine command callers through it. Ticket 17b-1
gave the designer's **read-only** displays a family-level projection of the parts
(`buildPartCatalogueView` → `readonly PartCatalogueEntry[]`), proven equal to the
legacy `data.components` projection for the shipped pack.

The designer's **edit** paths still read the legacy global `ComponentDef[]`
(`content.components`): the hull-plan lookup (`planModel.defOf`), the `allowedZones`
zone rule (`placement-edits`, `PlacementsPanel`, `systems-view`), the parameter editors
(`ArmamentEditor`, `BatteryPanel`/`batteryView`), the add menu, sections, funnels and
selection. A parts-less pack must keep rendering and editing, so a fallback is required.

The two catalogues the designer and the engine read are **not the same list**:

- `content.components` is the **global** shared catalogue (`data.components`), which
  the family-level parts view reproduces faithfully.
- `ctx.catalogue` is the **nation-filtered** catalogue (`catalogueForNation` drops
  UNAVAILABLE families, enforces the calibre ceiling, and overlays national gun models
  and variants). It is not reproducible from the nation-agnostic part model, and the
  pure compile (`compileDesign`) and the AI candidate generator (`suggest`, `ai`) read
  it for resolution and availability.

## Decision

### 1. `PartCatalogueEntry` is the designer's edit DTO

`PartCatalogueEntry` gains the legacy `parameters` map (rebuilt from the part's
`entryUnits` count plus `rounds`) and an optional `allowedZones`. The part schema has
no destination for `allowedZones` (ADR-0154 §19 — authoring it is a
`PARTCAT_UNMAPPED_FIELD` failure), so the parts view leaves it absent: every zone
accepts every fitting, exactly the legacy behaviour for the shipped pack.
`legacyCatalogueView` carries the legacy field unchanged, so a component that ever
authored `allowedZones` keeps its rule.

### 2. The designer's edit/display reads move to the parts view

Every designer read of the **global** `content.components` becomes `content.catalogue`,
the parts-derived view: `planModel.entryOf` (the separate `defOf` is retired),
`placement-edits`/`auto-place`/`useHullPlanEditing`/`PlanToolbar`, `PlacementsPanel`,
`ArmamentEditor`, `BatteryPanel`/`batteryView`, `RevisionPanel`, `ShipbuildingWorkspace`,
`selection`, `systems-view`, `section-facts`, `funnelPlacements`. Behaviour is preserved
because the view is proven equal to the legacy projection on every field these paths
read (`partCatalogueView.test.ts`, `content.test.ts`).

### 3. The compile engine and the AI candidate generator stay on `ctx.catalogue`

`compileDesign`, `suggest` and `ai` continue to read the **nation-filtered**
`ctx.catalogue`. Rebuilding `ctx.catalogue` from the parts is the 17c cut-over: the
buildable catalogue carries evaluated quantities, not the formula strings and arbitrary
parameter ranges `ComponentDef` exposes, so a faithful parts→`ComponentDef` projection
is not available yet, and the nation filter has no parts equivalent. Migrating these
paths now would change gameplay (unavailable families would become selectable), which
17b-2 must not do.

### 4. Compatibility fallbacks are explicit and preserved

- A pack without a `partModel` still renders and edits: `content.catalogue` is
  `legacyCatalogueView(components)`.
- Design-file identity is unchanged: `exportDesign`/`importDesign` keep hashing the
  legacy `content.components` (`componentHash` over the full `ComponentDef`), so
  `componentHashes` and content-drift detection against existing `.bwdesign` files stay
  stable. Migrating it is 17c.

## Consequences

- The designer no longer reads the global `ComponentDef` catalogue except for the
  design-file identity; `content.components` can be retired from the designer once the
  identity source is migrated (17c).
- No authoritative hash moves: `pnpm check:golden` stays 11/11 and
  `pnpm check:equivalence` byte-identical, because the compile engine and content are
  untouched. The change touches `packages/ship-design/src`, so its commit carries a
  `Golden-Repin: not-needed` trailer.
- **17c** rebuilds `ctx.catalogue` (and the AI/compile reads) from the parts and retires
  `ComponentDef` and the P1 read-path adapters; **17d** freezes the equivalence
  baseline and removes `@bluewave/content-codemod`.

## Alternatives considered

- **Rebuild `ctx.catalogue` from the part model in 17b-2.** Rejected: the parts carry
  evaluated quantities, not the formula strings and arbitrary parameter ranges the
  legacy compile reads, and the nation filter has no parts equivalent; a partial
  rebuild would change authoritative gameplay.
- **Point `suggest`/`ai` at the family-level parts view.** Rejected: it is
  nation-agnostic, so it would offer families the nation cannot obtain — a gameplay
  regression. Deferred to 17c with the `ctx.catalogue` rebuild.
- **Migrate design-file hashing to the parts view.** Rejected for now: it would change
  the persisted component identity and break drift detection against existing files.
