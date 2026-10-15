# ADR-0161: The ship-part cutover is derive-first — the legacy catalogue retires only after a parts-native derive pipeline exists

## Status

Accepted (2026-10-14). Supplements [ADR-0154](ADR-0154-ship-part-model.md) (the part
model) and [ADR-0160](ADR-0160-designer-reads-the-parts-catalogue.md) (the designer's
parts-catalogue read); it supersedes neither. Ticket ship-part-model 17, tracked under
[DEFERRALS](../DEFERRALS.md) D-11.

## Context

ADR-0154 made the compiled **part model** authoritative for ship-building content and
ADR-0160 moved the designer's reads onto a parts-derived catalogue view. Ticket 17's
slices name the rest as 17a-2/17b/17c/17d. Several agents have since read "17c" as
permission to rebuild the runtime catalogue and remove the legacy production
catalogue. That reading is unsafe today: the production compile is not parts-native,
and the canonical part model does not carry the inputs the compile consumes.

The facts, confirmed against the tree at `85f896cc`:

- **The production compile still needs the formula-bearing `ComponentDef`.** Every
  production `compileDesign` reaches `resolveDesignComponents`
  (`packages/ship-design/src/compileStages.ts`), which evaluates `def.weightKg`,
  `def.volumeLitre`, `def.costMicro`, `def.crew`, `def.powerKw`, `def.coolingKw`,
  `def.heightMm`, `def.zCgMm` and every `def.attributes.*` as restricted-grammar
  formulas over `def.constants` and the placement's chosen `def.parameters`. The parts
  barrier itself still derives through the legacy compile:
  `compileDesignFromLoadout` → `rebuildDraft` → `compileDesignThroughFit` →
  `compileDesign(draft, ctx)` (`compileProduction.ts`, `compileThroughFit.ts`).
- **The canonical part model carries evaluated affine quantities and parameter
  ranges, not formulas.** ADR-0154 §15: "A part has no formulas, so the read path (and
  P2's codemod) translates a component's mass, cost, crew, volume and deck-footprint
  formula only when it is affine in one declared count parameter." Facts with no part
  schema home — component height, centre of gravity, electrical and cooling load, and
  other attributes — "stay on adapter-side records, never on a part." The translators
  live in `legacyComponentQuantities.ts` and `partCatalogueFormulas.ts`.
- **A faithful general part → `ComponentDef` reconstruction is not currently
  possible.** A part stores an affine decomposition (`fixed + perUnit × count`) plus
  typed spec fields and capabilities; it does not store the original expression, the
  non-count parameters a formula may read, or the free-form `attributes` map. No
  inverse exists in the tree (searched for `toComponentDef|componentDefFrom|
  buildComponentDef|componentsFromParts`).
- **A `ComponentDef`-shaped projection from incomplete part data would be a second
  content authority or an impermissible compatibility wrapper.** It would present
  authored-looking formulas the parts never carried, and any consumer reading it could
  diverge silently from the parts.
- **`ctx.catalogue` is nation-filtered, the part model is nation-agnostic.**
  `catalogueForNation` (`componentVariants.ts`) drops UNAVAILABLE families, enforces
  the calibre ceiling and overlays national gun models and variants; there is no parts
  equivalent of that overlay yet.

Completed work is correct and must stand: the read-only and edit-path migrations of
17b-1/17b-2 are behaviour-preserving and pinned by
`packages/ship-design/test/partCatalogueView.test.ts` and the designer suites.

## Decision

### 1. `ctx.catalogue` is not rebuilt from parts until a parts-native derive exists

The runtime catalogue stays the nation-filtered legacy `ComponentDef[]` until a
parts-native derive pipeline produces the same derived metrics. 17c must **not** be
read as permission to remove the legacy production catalogue first.

### 2. No parts → `ComponentDef` reconstruction

Reconstructing `ComponentDef`s from the affine part representation is rejected: it is
a compatibility wrapper around the legacy projection and would create a second content
authority. The cutover either carries the derive inputs on canonical parts or rewrites
the compile to consume the affine representation directly — never a synthesized legacy
catalogue.

### 3. Stage 0 is a recorded decision, not an implementation

No runtime cutover may begin until the **derive-input decision** (§3, Stage 0) is
recorded as an accepted ADR: whether canonical parts carry formula/derive inputs, or
the compiler is rewritten to consume the existing affine part representation. That ADR
must state the chosen authority, the rejected alternative, the migration implications,
and the effect on SPM-R5 (which fixes the application bases but does not yet decide
where the derive inputs live).

### 4. The dependency sequence

Stages run in order; each stage is a gate, not a schedule. Names reuse the ticket's
slices.

| Stage | Name | Ticket slice | Gate |
| --- | --- | --- | --- |
| 0 | Derive-input decision | new (pre-17a-2) | A decision ADR is accepted |
| 1 | Parts-native derive implementation | 17a-2 | No production compile reads `Map<string, ComponentDef>` |
| 2 | Remaining edit, suggestion, AI and refit consumers | 17b-3 / 17c | A no-new-reader gate is green |
| 3 | Runtime catalogue and persistence cutover | 17c | Parts-owned runtime view + versioned design-file identity |
| 4 | Legacy retirement | 17c / 17d | Legacy symbols deleted; baseline frozen |

#### Stage 0 — Derive-input decision

- **Prerequisites:** none. This is the first gate.
- **Authority before/after:** parts carry evaluated quantities and ranges (unchanged);
  after, the decision fixes where the compile's inputs live.
- **Production callers:** none changed.
- **Compatibility behaviour:** none changed.
- **Tests / gates:** the decision ADR itself; no code gate.
- **Hashes / identities:** none may change.
- **Completion criteria:** an accepted ADR records the chosen authority, the rejected
  alternative, the migration implications and the SPM-R5 effect.
- **Non-goals:** no schema field, codemod or compile change lands in this stage.

#### Stage 1 — Parts-native derive implementation

- **Prerequisites:** Stage 0 accepted.
- **Authority before/after:** before, `compileStages`/`compile`/`armamentCompile`
  read `ctx.catalogue: readonly ComponentDef[]`; after, they read the chosen
  parts-native representation.
- **Production callers:** `packages/phase-engine/src/{reviseProject,startRebuild,
  rebuildClassification,designStudies,aiProcurement,orderEligibility,commands}.ts`,
  `packages/phase-engine/src/refitRules.ts`, and the desktop design commands (via the
  parts barrier). Nation filtering, upgrade and variant behaviour are included.
- **Compatibility behaviour:** the legacy catalogue remains the source until the
  derive path is proven; no dual-write that leaves it permanently authoritative.
- **Tests / gates:** focused equivalence tests per derive consumer; deterministic
  ordering with explicit comparators; cancellation propagation; typed actionable
  errors. `pnpm check` green.
- **Hashes / identities:** derived metrics must be preserved; if a semantic change is
  intended, goldens re-pin through the approved process (§7). Any campaign-hash move
  is an approved diff.
- **Completion criteria:** no production compiler reconstructs or requires a legacy
  `Map<string, ComponentDef>`.
- **Non-goals:** removing the legacy symbols; migrating persistence.

#### Stage 2 — Remaining edit, suggestion, AI and refit consumers

- **Prerequisites:** Stage 1 green.
- **Authority before/after:** `suggest`, the AI candidate generator, `refit`, placement
  and workshop calculations move from `ctx.catalogue` to the parts-native runtime view.
- **Production callers:** `packages/ship-design/src/{suggest,ai,refit,workshop,edits}.ts`
  and the designer's remaining reads (already on `content.catalogue` since 17b-2).
- **Compatibility behaviour:** a no-new-reader or dependency-boundary gate is added
  **before** any compatibility code is deleted.
- **Tests / gates:** the new gate plus the focused consumer suites; `pnpm check` green.
- **Hashes / identities:** none expected; any move is re-pinned per §7.
- **Completion criteria:** every remaining reader is inventoried and migrated or
  explicitly classified; the no-new-reader gate is green.
- **Non-goals:** deleting the legacy symbols (Stage 4).

#### Stage 3 — Runtime catalogue and persistence cutover

- **Prerequisites:** Stages 1–2 green.
- **Authority before/after:** the runtime content is a parts-owned nation-filtered
  view; the design file carries a versioned parts-based identity.
- **Production callers:** `shipBuildingContent.ts` (`ctx.catalogue` construction),
  `persistence.ts` (`componentHash`/`encodeDesignFile`/`decodeDesignFile`), the
  renderer `designFile.ts` and `FilePanel.tsx`.
- **Compatibility behaviour:** an explicit design-file identity version with a scoped
  legacy reader for older `.bwdesign` files; unresolved or malformed identity data is
  reported, never silently treated as corruption (§5).
- **Tests / gates:** stable identity for unchanged semantic content and intentional
  identity change for changed content; round-trip, legacy-import, malformed-identity
  and deterministic-generation tests; `pnpm check` green.
- **Hashes / identities:** the persisted identity version may change by design; the
  compatibility reader's lifetime and removal criteria are documented.
- **Completion criteria:** production designer and engine read parts-derived content
  only; old files import through the scoped reader.
- **Non-goals:** Stage 0's schema decision does not reopen here.

#### Stage 4 — Legacy retirement

- **Prerequisites:** the no-new-reader gate green.
- **Authority before/after:** after, `ComponentDef` guns, `componentVariants`, the
  profile gun-model overrides, `upgradePath`, the P1 read-path adapters and the other
  projections are deleted.
- **Production callers:** none remain.
- **Compatibility behaviour:** the parts-less fallback (`legacyCatalogueView`,
  `content.ts` `catalogueView`) and `compileDraft.ts` retire only when their bounded
  support is deliberately removed; until then they are explicit and bounded.
- **Tests / gates:** the no-reader check; decoding content that still uses a removed
  field (`upgradePath`) must fail strictly.
- **Hashes / identities:** intentional golden and content-lock updates are a
  **separate mechanical change** from the semantic implementation, with an approved
  diff and the correct commit trailer (§7).
- **Completion criteria:** every retired symbol has no reader; `pnpm check` green;
  `pnpm snap` shows no designer churn.
- **Non-goals:** removing the frozen equivalence baseline that 17d needs, until 17d.

### 5. Reader inventory

Paths and symbols confirmed against the tree at `85f896cc`. Classification vocabulary:
already migrated · compatibility-only · production blocker · persistence blocker ·
concurrent-session-owned · removable only during legacy retirement.

| Reader (path — symbol) | Role | Classification |
| --- | --- | --- |
| `packages/ship-design/src/partCatalogueView.ts` — `buildPartCatalogueView`, `PartCatalogueEntry` | parts → family-level designer view | already migrated |
| `apps/desktop/src/renderer/components/design-workspace/content.ts` — `catalogueView` | builds `DrawingBoardContent.catalogue` from parts (or legacy fallback) | already migrated |
| design-workspace display/edit reads of `content.catalogue`: `componentFacts.ts`, `panels/hull-plan/{planModel.ts,placement-edits.ts,auto-place.ts,useHullPlanEditing.ts,PlanToolbar.tsx,section-facts.ts,funnelPlacements.ts}`, `panels/{PlacementsPanel.tsx,BatteryPanel.tsx,batteryView.ts,RevisionPanel.tsx,HistoryPanel.tsx}`, `selection/facts.ts`, `screens/shipbuilding/{ShipbuildingWorkspace.tsx,systems-view.ts,armament.ts,selection.ts,components/ArmamentEditor.tsx}` | designer read-only/edit paths | already migrated |
| `packages/ship-design/src/partCatalogueView.ts` — `legacyCatalogueView`; `apps/desktop/.../content.ts` fallback branch | parts-less pack fallback | compatibility-only |
| `packages/ship-design/src/compileDraft.ts` | forward adapter: legacy components → parts for the desktop design commands | compatibility-only |
| `packages/ship-design/src/compile.ts` — `compileDesign` (`Map<string, ComponentDef>`); `compileStages.ts` — `resolveDesignComponents` (formula eval); `compileShared.ts` — `ShipContext.catalogue`, `Resolved.def` | the derive itself | production blocker |
| `packages/ship-design/src/armamentCompile.ts` — `resolvableWeaponFamilies` (`components: ctx.catalogue`) | AI gun-family filter | production blocker |
| `packages/ship-design/src/suggest.ts`; `ai.ts` | suggestion + AI candidate generation | production blocker |
| `packages/ship-design/src/refit.ts` (`ctx.catalogue` fallback) | refit classification | production blocker |
| `packages/ship-design/src/componentVariants.ts` — `catalogueForNation`; `shipBuildingContent.ts` — `buildShipBuildingContent` | nation filter + runtime `ctx.catalogue` construction | production blocker |
| `packages/phase-engine/src/{reviseProject,startRebuild,rebuildClassification,designStudies,aiProcurement,orderEligibility,commands}.ts`; `refitRules.ts` — `gunDiffOf`, `ctx.catalogue` | engine derive callers | production blocker |
| `packages/ship-design/src/{equivalenceCandidate,report,nationCompleteness}.ts` | equivalence/report/completeness reads | production blocker (retires with the frozen baseline in 17d) |
| `packages/ship-design/src/persistence.ts` — `componentHash`, `encodeDesignFile`, `decodeDesignFile`, `DesignFile.componentHashes`, `DESIGN_SCHEMA_VERSION` | design-file identity | persistence blocker |
| `apps/desktop/src/renderer/components/design-workspace/designFile.ts` — `exportDesign`/`importDesign`; `panels/FilePanel.tsx` | renderer design-file codec | persistence blocker |
| `apps/desktop/src/main/shipBuildingContent.ts` — `components` DTO; `apps/desktop/src/main/commands/designCommands.ts` (`content.components` map); `apps/desktop/src/main/runtime/**` | main-process content/commands | concurrent-session-owned (feat/effect-apps-runtime) |
| `packages/ship-design/src/{gunPartAdapter,torpedoPartAdapter,fittingPartAdapter,ammunitionPartAdapter,legacyComponentQuantities,partCatalogue,partCatalogueFormulas,partReadPath,componentVariants}.ts`; `component.ts` — `ComponentDef`; `upgradePath` in `packages/content-schema/src/ship-component.ts`, `packages/content-compiler/src/stages/validate.ts`, `content/production/1880/ship-building/components.yaml` | P1 adapters, projections and the legacy schema field | removable only during legacy retirement |

Retained (production inverse readers, not retired): `plantPartAdapter.ts`,
`armourPartAdapter.ts`, `partCatalogueReaders.ts`.

### 6. Compatibility lifetime and removal criteria

- **Parts-less packs.** `legacyCatalogueView` and the `compileDraft.ts` forward adapter
  are the bounded compatibility path for a pack without a `partModel` (exactly one
  production pack, `content/production/1880`, ships with `armament`). They retire only
  when the repository deliberately drops parts-less support in Stage 4, with a
  recorded decision.
- **Design-file identity.** The Stage 3 versioned reader is scoped to reading older
  `.bwdesign` files only. Its removal criterion: every shipped campaign/workspace file
  is at or above the new identity version, at which point the legacy reader is deleted
  in a later mechanical change.

### 7. Golden, content-lock and equivalence discipline

- Hash changes are allowed **only after** the semantic boundary is deliberately
  changed (Stage 1 or later). A hash move with no behavioural cause is a regression.
- The golden procedure is [golden-repinning](../agents/golden-repinning.md):
  `node scripts/verify-golden-hashes.cjs` → cross-process agreement →
  `node scripts/regenerate-golden-hashes.cjs` → review → old→new recorded.
- Content identity moves by refreshing `content/production/1880/content-lock.json`
  deliberately (ADR-0145); a parts-derived metric difference that appears in the
  equivalence report must match an owner-approved
  `packages/ship-design/approved-diffs.json` entry (SPM-R25).
- Every hash-affecting commit carries the re-pin or the `Golden-Repin: not-needed`
  trailer per the guard (`scripts/verify-golden-repin.mjs`, ADR-0136).

### 8. Boundary: the concurrent Effect-runtime session

`apps/desktop/src/main/**` is owned by the active `feat/effect-apps-runtime` worktree
(ADR-0159; `apps/desktop/src/main/runtime/**`). This ADR records the boundary and the
affected symbols (`shipBuildingContent.ts` `components` DTO, `designCommands.ts`
`content.components` maps, `runtime/**`) but changes none of them. Any cutover that
must edit those files waits for that worktree or is coordinated with it.

## Consequences

- 17c is explicitly a **derive-first** gate: it may not remove the legacy production
  catalogue before Stage 1 lands, and it never synthesizes `ComponentDef`s from parts.
- The 17b-1/17b-2 read-only and edit migrations stay valid; the parts-less fallback is
  explicit and bounded, not a silent dual authority.
- Design-file identity migration is coordinated with the runtime-view migration and
  carries a versioned legacy reader; existing `.bwdesign` files are not invalidated.
- The SPM-R5 decision (where the derive inputs live) is recorded as an open question
  to be closed by Stage 0, not assumed here.
- Remaining deferred work stays in the ledger (D-11).

## Alternatives considered

- **Rebuild `ctx.catalogue` from parts now, preserving formulas and ranges.** Rejected:
  the parts carry evaluated affine quantities, not formulas, and a general
  reconstruction does not exist; a synthesized catalogue would be a second authority.
- **Treat "17c" as authorisation to delete the legacy symbols first.** Rejected: the
  production derive still reads `ctx.catalogue`, so deletion would break every
  production compile; this is the misreading this ADR exists to prevent.
- **Migrate design-file identity independently of the runtime view.** Rejected: the
  identity is defined over the same component/part mapping as the runtime catalogue,
  so doing it first would churn the persisted schema twice.
