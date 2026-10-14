# 15: Retire the legacy part formats (P5)

**Type:** implementation
**Status:** resolved (partial — remaining retirement owned by ticket 17)
**Blocked by:** 12, 13, 14
**Frontier:** no
**Requirements:** SPM-R26 (P5 gate) · Story 51

## What to build

There is now one representation for ship parts. The following are deleted:

- `ComponentDef` guns;
- `componentVariants`;
- the national profile gun-model overrides;
- the armament adapter;
- the P1 read-path adapter;
- `upgradePath`;
- any combat torpedo constant still left.

Once the legacy baseline pipeline no longer exists, the equivalence harness keeps the
committed P2 report as its frozen baseline.

## Acceptance criteria

- [ ] Each removed symbol and schema field has no remaining reader. A grep/no-reader
      check is recorded in the ticket.
- [ ] All goldens and the committed equivalence reports are unchanged.
- [ ] Decoding content that uses a removed field fails.
- [ ] `pnpm check` is green.

## Resolution (partial, 2026-10-14)

**The ticket's premise is not met, so only the no-reader legacy could be retired.**
Ticket 11d built the parts barrier (`compileDesignFromLoadout`, `compileProduction.ts`)
but left it **test-only**: the desktop design commands still compile through
`compileDesign(draft, environmentFor(month).ctx)` (`apps/desktop/src/main/commands/designCommands.ts:78,270,485`),
which resolves every placement from `ctx.catalogue: ComponentDef[]`. The legacy
baseline pipeline and the parts pipeline therefore still both exist; there is no
"one representation" to converge on yet, and the equivalence harness's baseline
is still the live production path.

### Retired now (no remaining reader)

- **`packages/ship-design/src/armamentAdapter.ts`** (+ `test/armamentAdapter.test.ts`
  + its `index.ts` export). The ADR-0093 armament adapter had no production or
  baseline reader; `test/armamentAdapter.test.ts` was its only consumer.
- **`mountsForGun`** (`componentVariants.ts`), a dead export with no reader.

No-reader evidence (all empty, recorded at commit):

```
rg -n 'armamentAdapter|adaptArmament|resolveArmamentFromContent|ARMAMENT_ADAPTER_UNMAPPED_FIELDS|ArmamentAdapterInput' --glob '*.ts' --glob '*.tsx' --glob '*.mjs'   # none
rg -n 'mountsForGun' --glob '*.ts' --glob '*.tsx'                                                                                                              # none
```

### Deferred to ticket 17 (blocked on the production cut-over)

Every other symbol in "What to build" still has a live reader and retires only once
production compiles from the parts barrier:

- `ComponentDef` guns — production (`compile.ts`/`compileStages.ts` via `ctx.catalogue`)
  and the whole Shipbuilding renderer (~17k lines).
- `componentVariants` and the national profile gun-model overrides — production
  (`environmentFor` → `catalogueForNation`).
- The P1 read-path adapters (`partReadPath.ts`, `gunPartAdapter.ts`, `torpedoPartAdapter.ts`,
  `fittingPartAdapter.ts`, `ammunitionPartAdapter.ts`, `legacyComponentQuantities.ts`,
  `partCatalogue.ts`, `partCatalogueFormulas.ts`) — read by the equivalence candidate,
  the `@bluewave/content-codemod` package, and the production-barrier **test fixtures**
  (`compileProduction.test.ts`, `partFitProduction.test.ts`, `torpedoParts.test.ts`).
  `plantPartAdapter.ts`/`armourPartAdapter.ts`/`partCatalogueReaders.ts` are production
  (inverse readers in `compileProduction.ts` and `shipBuildingContent.ts`) and stay.
- `upgradePath` — still decoded and validated from `components.yaml`
  (`ShipComponentSchema`, `component.ts` lint, `content-compiler/stages/validate.ts`).
  Removing it moves the content lock and the `contentArtifactHash` golden, so it cannot
  be retired under this ticket's AC2.
- The equivalence-baseline harness — its baseline is the legacy compile, which is still
  production; it converts to a frozen committed baseline only after ticket 17.

The combat torpedo constants were already removed in 13b
(`scripts/verify-no-torpedo-model-constants.mjs`, green).

### Acceptance status

- AC 1 (partial): only the armament adapter and `mountsForGun` were removable with no
  reader; the grep check above is recorded. The rest retires with ticket 17.
- AC 2: **unchanged** — no content, schema or golden moved (`pnpm check:golden`,
  `pnpm check:equivalence` byte-identical).
- AC 3: not applicable to this slice (no schema field removed); it moves to ticket 17.
- AC 4: `pnpm check` green.
