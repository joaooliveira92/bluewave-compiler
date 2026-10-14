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
| **17a** Production barrier wiring | `compileDesignFromLoadout` runs on the desktop design commands and every production `compileDesign(draft, …)` caller; the legacy catalogue is still present but unused for compile. Round-trip test: the same draft compiles identically from its loadout. | AC 1 |
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