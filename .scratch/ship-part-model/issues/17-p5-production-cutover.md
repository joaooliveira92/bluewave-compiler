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

## Derive-first clarification (ADR-0161)

**Read [ADR-0161](../../../docs/adr/ADR-0161-derive-first-ship-part-cutover.md) before
starting any slice.** It supplements ADR-0154/ADR-0160 and fixes the order this ticket
must be worked in; it does not supersede them.

- **The production compile is not parts-native yet.** Every production `compileDesign`
  reaches `resolveDesignComponents` (`packages/ship-design/src/compileStages.ts`), which
  evaluates the legacy `ComponentDef` **formulas** (`def.weightKg`, `def.attributes.*`,
  `def.constants`, `def.parameters`). The parts barrier itself derives through that
  compile (`compileDesignFromLoadout` → `rebuildDraft` → `compileDesignThroughFit` →
  `compileDesign`). `ctx.catalogue` stays the nation-filtered legacy `ComponentDef[]`
  until a parts-native derive exists.
- **The canonical part model carries no formulas.** ADR-0154 §15: a part stores an
  affine quantity decomposition (`fixed + perUnit × count`) over one count parameter,
  and the facts the schema has no field for (component height, centre of gravity,
  electrical and cooling load, other attributes) "stay on adapter-side records, never on
  a part." A general part → `ComponentDef` reconstruction therefore does not exist, and
  synthesizing one would be a second content authority / compatibility wrapper —
  forbidden.
- **17c must not be read as permission to remove the legacy production catalogue
  first.** Doing so would break every production compile. A **Stage 0 derive-input
  decision** must be recorded (as an accepted ADR) before any runtime cutover: decides
  whether canonical parts carry the derive inputs or the compiler is rewritten to
  consume the affine representation directly, and states the effect on SPM-R5.

The 17b-1/17b-2 read-only and edit-path migrations are correct and stay; do not roll
them back. ADR-0161 carries the stage-by-stage entry/exit criteria, the authoritative
representation before/after each stage, the reader inventory, the compatibility
lifetime, and the concurrent-session boundary (`apps/desktop/src/main/**`, owned by
`feat/effect-apps-runtime`).

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
| **Stage 0** Derive-input decision | An accepted ADR fixing whether canonical parts carry the derive inputs or the compiler is rewritten to consume the affine part representation, with the rejected alternative and the SPM-R5 effect recorded. **No runtime cutover may begin before this (ADR-0161).** | new — decision recorded |
| **17a-2** Parts-native derive | The phase-engine derive callers ported off `ctx.catalogue` (`packages/ship-design/src/{compile,compileStages,armamentCompile}.ts`, nation filtering, upgrade/variant behaviour); no production compiler reconstructs or requires `Map<string, ComponentDef>`. | AC 1, 2 (derive) |
| **17a** Production barrier wiring | `compileDesignFromLoadout` runs on the three desktop design commands; the legacy catalogue is still present but unused for that compile. Round-trip test: the same draft compiles identically from its loadout. | AC 1 (desktop surface only) |
| **17b** Designer reads parts | The Shipbuilding workspace and shared design-workspace layer take their catalogue/facts from the parts (or a parts-derived DTO). Snapshot/aria proof. | AC 1, 6 |
| **17c** Retire the legacy formats | **Only after 17a-2 (parts-native derive) and the Stage 2 no-new-reader gate (ADR-0161):** `ComponentDef` guns, `componentVariants`, profile `gunModels`, `upgradePath`, the P1 read-path adapters and the armament adapter deleted; content lock + goldens re-pinned via an approved diff. | AC 2, 3, 5 |
| **17d** Freeze the baseline | Legacy baseline pipeline removed; equivalence harness runs against the frozen committed report; `@bluewave/content-codemod` deleted. | AC 4 |

**Blocked by 15** for the record only — 15's no-reader slice landed; 17 owns the
remaining retirement and is the frontier.

See [ADR-0161](../../../docs/adr/ADR-0161-derive-first-ship-part-cutover.md) for the
entry/exit criteria, the authoritative representation before/after each stage, the
reader inventory, the compatibility lifetime and the concurrent-session boundary. The
full sequence is Stage 0 → 17a-2 → 17b-3/17c consumers → 17c runtime catalogue and
persistence → 17c/17d retirement; 17c is not the first step.

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

**17b-2 landed (this commit):** the designer's **edit** paths now read the parts-derived
catalogue view, finishing the read-only migration of 17b-1. `PartCatalogueEntry` gains the
legacy `parameters` map (rebuilt from `entryUnits` + `rounds`) and an optional `allowedZones`,
so the zones rule, the parameter editors and the add menu read the parts; the parts-less
fallback (`legacyCatalogueView`) carries the legacy fields unchanged. `planModel.defOf` is
retired in favour of `entryOf`; `placement-edits`, `auto-place`, `useHullPlanEditing`,
`PlanToolbar`, `PlacementsPanel`, `ArmamentEditor`, `BatteryPanel`/`batteryView`,
`RevisionPanel`, `ShipbuildingWorkspace`, `selection`, `systems-view`, `section-facts` and
`funnelPlacements` all read `content.catalogue`.

The **compile engine** (`compileDesign`) and the **AI candidate generator** (`suggest`, `ai`)
still read the nation-filtered `ctx.catalogue`: the part model is nation-agnostic and carries
evaluated quantities, not the formula strings and arbitrary parameter ranges the legacy compile
reads, so a parts→`ComponentDef` projection and the nation filter are not available until 17c.
Design-file identity also stays on the legacy components (its `componentHash` contract). See
ADR-0160. No golden or equivalence hash moved (`check:golden` 11/11, `check:equivalence`
byte-identical); the commit carries `Golden-Repin: not-needed`.

**17b-3 remains:** retire `content.components` from the designer once design-file identity and
the nation-filtered reads have a home, then 17c/17d as below.

**Resolved after 17b-1:** `pnpm check:golden-repin` was red on `dev` because the 17a
commit `a9eae221` changed authoritative ship-design source without a same-commit golden
re-pin or a `Golden-Repin: not-needed` trailer. Commit `6348b128`
(`chore(golden): advance the re-pin ratchet past the 17a cut-over`) advanced
`scripts/golden-repin.baseline`; `pnpm check:golden-repin` is green at `85f896cc`
(verified: `ok (8 commit(s) in "a9eae221…85f896cc")`). `pnpm check:golden` (11/11) and
`pnpm check:equivalence` are green, so 17b-1/17b-2 moved no golden or content hash.

### Stage 0: the derive-input decision (landed)

The Stage 0 gate is recorded as [ADR-0163](../../../docs/adr/ADR-0163-derive-inputs-on-canonical-parts.md)
(`Accepted 2026-10-15`). It decides that the derive **reads the canonical part
representation** — the affine `quantities` scaled by their SPM-R5 basis, plus the typed
`engineering`, `capabilities`, `spec`, lifecycle, tags, `entryUnits` and parameter ranges —
and that a part carries **evaluated derive inputs, never formulas or `constants`**.

The rejected alternative (carrying the legacy formulas/`constants` on parts so the compiler
keeps evaluating) and the `ComponentDef` reconstruction are both rejected, per ADR-0154 §15
and ADR-0161 §2. SPM-R5 is unchanged and becomes the derive's sole mass-application
mechanism.

The inventory against the tree at `1f34161b` found exactly **six derive inputs with no part
home**, which Stage 1 (17a-2) must give typed homes before the derive can read parts:

- `allowedZones`, `forbidsCoLocation`, `buildWorkMicro`, `productionLine` — declared
  `(none)` and rejected as `PARTCAT_UNMAPPED_FIELD` (`partCatalogue.ts`);
- `attributes.flammableBp` — read at `compileStages.ts`, un-authored today (always `0`);
- the legacy `ComponentCategory` token — parts carry `family` + `spec.weaponCategory` only,
  so a code-owned family→category adapter is needed (`ComponentSummary.category` stays).

Everything else the derive reads already has a typed destination (height, centre of gravity,
electrical/cooling load and the capability attributes included). **17a-2 (Stage 1) is
unblocked and is the next slice**; it is a schema change as well as a compiler change, and
moves the content lock/`contentArtifactHash`/`contentBundleHash` when the codemod emits the
new homes (re-pinned through the approved process). D-11/D-12 are updated to match.
