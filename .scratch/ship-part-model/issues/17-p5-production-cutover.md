# 17: P5 completion — cut production over to the parts barrier and retire `ComponentDef` guns

**Type:** implementation
**Status:** open
**Blocked by:** 15
**Frontier:** yes
**Requirements:** SPM-R18, SPM-R20, SPM-R24, SPM-R25, SPM-R26 (P5 gate) · Stories 30, 51

## Why this ticket exists

Ticket 15 could not finish the P5 retirement because its precondition — "there is now
one representation" — is not met. Ticket 11d built the parts barrier
(`compileDesignFromLoadout`, `packages/ship-design/src/compileProduction.ts`) but left it
**test-only**. The desktop still compiles designs through the legacy `ComponentDef`
catalogue:

- `apps/desktop/src/main/commands/designCommands.ts:78,270,485` call
  `compileDesign(draft, content.environmentFor(month).ctx)`;
- `compileDesign` resolves every placement from `ctx.catalogue: ComponentDef[]`
  (`packages/ship-design/src/compile.ts`, `compileStages.ts`);
- `apps/desktop/src/renderer/screens/shipbuilding/**` and
  `apps/desktop/src/renderer/components/design-workspace/**` (~17k lines) read that
  catalogue for the designer UI.

Until production compiles from the parts loadouts, the legacy formats are live and
ticket 15's AC1 ("no remaining reader") cannot be met. This ticket delivers the cut-over
and completes the retirement.

## What to build

1. **Production compiles from parts.** Route every production `compileDesign(draft, …)`
   caller through `compileDesignFromLoadout` (or an equivalent parts-first entry point),
   so a design's placements, machinery and armour are rebuilt from its committed
   `DesignHeader` + `DesignLoadout` and validated by `validateLoadoutFit` before
   `deriveAfterFit` reaches `compileDesign`. No production caller may read
   `ctx.catalogue` for a gun, tube or fitting placement.
2. **The designer reads parts, not `ComponentDef`.** The Shipbuilding workspace and the
   shared `design-workspace` layer derive their catalogue, placement rules, mount
   layouts and component facts from the compiled `partIndex`/queries (or a
   ComponentDef-shaped runtime DTO rebuilt from parts). This is the large slice.
3. **Retire the legacy symbols.** `ComponentDef` guns, `componentVariants` (and the
   national profile `gunModels`/`componentVariants` overrides), `upgradePath` (schema +
   `content/production/1880/ship-building/components.yaml`, and the content-compiler
   validation), the P1 read-path adapters (`partReadPath.ts`, `gunPartAdapter.ts`,
   `torpedoPartAdapter.ts`, `fittingPartAdapter.ts`, `ammunitionPartAdapter.ts`,
   `legacyComponentQuantities.ts`, `partCatalogue.ts`, `partCatalogueFormulas.ts`), and
   the armament adapter.
4. **Freeze the equivalence baseline.** The legacy baseline pipeline no longer exists
   once production is cut over; the equivalence harness keeps the committed P2 report
   as its frozen baseline (pinned coverage/data-quality fixtures, no legacy re-run).
   Retire `@bluewave/content-codemod` — its one-shot rewrite is committed and
   authoritative.
5. **Re-pin the goldens deliberately.** Removing `upgradePath` from `components.yaml`
   (and any content change) moves the content lock and `contentArtifactHash`/
   `contentBundleHash`; campaign goldens move if any reclassified design feeds one. The
   re-pin is an SPM-R25 approved diff with the report attached and an owner sign-off —
   this ticket explicitly lifts ticket 15's "goldens unchanged" freeze.

## Acceptance criteria

- [ ] Production compiles designs through the parts barrier; no production caller of
      `compileDesign(draft, ctx.catalogue)` remains (grep/no-reader gate).
      **17a is a partial step only**: it cuts over the three desktop design-command call sites
      (see the deferral note below); the remaining production callers and the grep/no-reader gate
      itself land in 17a-2/17b/17c/17d.
- [ ] Every symbol in §3 has no remaining reader; a grep/no-reader check is recorded.
- [ ] Decoding content that still uses a removed field (`upgradePath`) fails strictly.
- [ ] The equivalence harness runs against the frozen committed baseline (no legacy
      pipeline), and `@bluewave/content-codemod` is gone.
- [ ] Goldens are re-pinned only through an approved `approved-diffs.json` entry with
      the equivalence report attached.
- [ ] `pnpm check` is green, and `pnpm snap` of the Shipbuilding workspace shows no
      churn for the migrated designer.

## Slicing (proposed)

| Slice | Delivers | Acceptance |
| --- | --- | --- |
| **17a** Production barrier wiring | `compileDesignFromLoadout` runs on the three desktop design commands; the legacy catalogue is still present but unused for that compile. Round-trip test: the same draft compiles identically from its loadout. | AC 1 (desktop surface only) |
| **17b** Designer reads parts | The Shipbuilding workspace and shared design-workspace layer take their catalogue/facts from the parts (or a parts-derived DTO). Snapshot/aria proof. | AC 1, 6 |
| **17c** Retire the legacy formats | `ComponentDef` guns, `componentVariants`, profile `gunModels`, `upgradePath`, the P1 read-path adapters and the armament adapter deleted; content lock + goldens re-pinned via an approved diff. | AC 2, 3, 5 |
| **17d** Freeze the baseline | Legacy baseline pipeline removed; equivalence harness runs against the frozen committed report; `@bluewave/content-codemod` deleted. | AC 4 |

**Blocked by 15** for the record only — 15's no-reader slice landed; 17 owns the
remaining retirement and is the frontier.

## Comments

- The `upgradePath` schema removal (AC 3) and the golden re-pin (AC 5) are the two
  changes ticket 15's AC2 forbade; they are the reason 15 is split rather than
  completed in place.
- `plantPartAdapter.ts` / `armourPartAdapter.ts` / `partCatalogueReaders.ts` are already
  production (the inverse readers) and stay.

### Deferred to 17a-2/17b/17c/17d: the remaining `compileDesign` callers

17a routes the **three desktop design-command call sites** through the parts barrier
(`compileDraftFromParts`, `packages/ship-design/src/compileDraft.ts`): `submitDesignCommand`,
`reviseProjectCommand` and `rebuildCheck`. Those are the only call sites this ticket cuts over, so
17a satisfies AC1 for that surface only. Every other production caller of the legacy
`compileDesign(draft, ctx)` remains, mapped to its owning slice:

- `packages/phase-engine/src/{reviseProject,rebuildClassification,designStudies,aiProcurement,orderEligibility,commands,startRebuild}.ts` → **17a-2**. They compile from the command drafts the engine applies and their results feed the authoritative campaign hashes, so moving them is a separate, hash-affecting slice whose golden moves are re-pinned as an SPM-R25 approved diff.
- `apps/desktop/src/renderer/components/design-workspace/panels/hull-plan/auto-place.ts:35,46` and `apps/desktop/src/renderer/components/design-workspace/useDrawingBoard.ts:142` (the latter through `ai.ts` `generateCandidates`) → **17b** (the designer reads parts, not `ComponentDef`).
- `packages/ship-design/src/workshop.ts:105`, `edits.ts:170-172`, `suggest.ts:107`, `ai.ts:228` → **17b** (the board's derived view; the edit, suggest and AI-candidate paths).
- `packages/ship-design/src/refit.ts:656,669,700`, `report.ts:33`, `nationCompleteness.ts:193`, `equivalenceCandidate.ts:405` → **17c/17d** (the refit, report and content-completeness read paths; the equivalence candidate retires with the frozen baseline in 17d).

The AC1 grep/no-reader gate ("no production caller of `compileDesign(draft, ctx.catalogue)`") is
authored in **17c/17d**, once those callers are gone; it cannot be met while this list is non-empty.
Until then the legacy catalogue remains live outside the desktop design commands.

### Known limitation: a pack without first-class armament no longer compiles drafts

`ShipBuildingContent.draftCompileContent` is built only when the pack carries an `armament`
section (`shipBuildingContent.ts`). A parts-less pack therefore has no `draftCompileContent`, and
`submitDesignCommand`/`reviseProjectCommand`/`rebuildCheck` refuse with "The ship-building content
carries no parts to compile a design from" where the legacy compile had a compatibility path. There
is exactly one shipped production pack (`content/production/1880`) and it carries `armament`, so no
shipped scenario regresses; the compatibility path is retired formally in 17c.

### 17b-1: the designer's read-only displays read a parts-derived catalogue view (landed)

First vertical slice of 17b. A new pure, runtime-free builder
`packages/ship-design/src/partCatalogueView.ts` (`buildPartCatalogueView(model)` →
`readonly PartCatalogueEntry[]`, plus `legacyCatalogueView(components)` as the parts-less
fallback) projects the family-level subset of the compiled parts: every gun family's
`standard_<family>` model, every `fitting`, the `sensor`, and the non-variant
`torpedo_launcher` bases — 45 entries for the 1880 artifact, equal to the legacy
`data.components` projection for every id and field the view carries (golden test
`packages/ship-design/test/partCatalogueView.test.ts`). National gun models, prototypes,
mounts and launcher variants are excluded, so the menu does not grow.

`DrawingBoardContent` now exposes `catalogue` (built from `partModel`, or the legacy
projection when absent — `content.ts` `catalogueView`). These read-only consumers read it:
`componentFacts.ts` (hover card), `planModel.ts` (`available`, `entryOf` for placed names),
`HistoryPanel.tsx`, `selection/facts.ts`, `armament.ts` (name, `fcClass`), and
`systems-view.ts` (availability, name, grouping). The edit/compile paths and
`systems-view.ts` `addSystemEdit`'s `allowedZones` stay on `content.components`;
`planModel.defOf` is kept for the out-of-scope edit path (`useHullPlanEditing`).

**17b-2 remains:** switch `planModel.defOf`/`allowedZones` and the remaining edit/AI suggestion
paths (`placement-edits`, `PlacementsPanel` add/params, `auto-place`, `useHullPlanEditing`,
`useDrawingBoard`, `optionDelta`/`buildWorkshopView`) once `allowedZones` has a home; then
`content.components` can be retired from the designer.

**Known, unresolved (not introduced by 17b-1):** `pnpm check:golden-repin` is red on `dev` — the
committed 17a commit `a9eae221` changed authoritative ship-design source without a same-commit
golden re-pin or a `Golden-Repin: not-needed` trailer. The orchestrator owns that commit and
its trailer. `pnpm check:golden` (11/11) and `pnpm check:equivalence` are green, so 17b-1 moved
no golden or content hash.