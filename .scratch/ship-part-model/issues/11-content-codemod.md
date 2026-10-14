# 11: One-shot content codemod, pipeline switch and save-compatibility activation (P2)

**Type:** implementation
**Status:** resolved (11a–11d all landed; 11d is the atomic activation)
**Blocked by:** 09, 10
**Frontier:** no
**Requirements:** SPM-R20, SPM-R21 (activation), SPM-R24 (campaign goldens), SPM-R26 (P2 gate) · Stories 29, 30, 33, 48

## What to build

Production content is rewritten once, deterministically, into parts, platforms and
loadouts, and the game compiles from it. The only non-numeric differences players could
observe are the nine approved central-battery reclassifications.

- The codemod applies the in-memory translations of tickets 03–05 to the files on disk
  (§9.2–9.4). One legacy placement becomes one loadout entry; entries are never split or
  merged.
- The production compile path switches to the parts pipeline. The legacy pipeline stays
  available to the harness as the baseline.
- Save compatibility 2.0.0 is activated **in the same change** as the rewritten content
  and the pipeline switch, so pre-2.0.0 saves start being refused exactly when the new
  content goes live. Development fixtures are converted with ticket 10's tool, if one
  was needed.
- The changelog announces the save-compatibility bump.
- The equivalence report is re-run and committed. Expected: zero `changed`; `reclassified`
  only on the nine D18 paths.
- The artifact re-pin is recorded under the golden re-pin guard (ADR-0136), with the
  report attached. Campaign goldens re-pin only if every difference traces to an R1
  reclassification.
- This lands as a single-purpose commit, staged by explicit pathspec with the staged set
  verified (shared-index rule).

## Acceptance criteria

- [ ] A codemod property test on generated legacy drafts proves
      `mountCount × gunsPerMount = barrels`, one entry per placement, and that invalid
      input is rejected.
- [ ] Running the codemod twice is a no-op, and it produces byte-identical output across
      processes.
- [ ] The committed P2 report passes every gate from tickets 08 and 09.
- [ ] Combat and campaign goldens are unchanged, or there is a recorded re-pin whose every
      difference is an approved reclassification.
- [ ] The rewritten content, the canonical pipeline and compatibility version 2.0.0
      arrive in one commit. No intermediate commit has old content with 1.2.0 saves
      refused, or new content with 1.2.0 saves accepted.
- [ ] Save-load seam tests from ticket 10 pass with the real current version (2.0.0).
- [ ] `compileDesign` routes loadout derivation through `deriveAfterFit`, so an invalid loadout
      yields fit findings and no derived metrics in the production pipeline (the barrier
      criterion of ticket 06, closed at stage level only there). A seam test proves it.
- [ ] The schema carries what ticket 06 could not evaluate, each with a fit check and test, or
      a recorded ADR deferral: platform availability windows, loadout-entry identity with
      duplicate and containment-cycle checks, and unlocked-technology requirements.
- [ ] `pnpm snap` of the Shipbuilding workspace, started with a 1.2.0 draft, shows the
      default design, a clean console and the preserved draft file.
- [ ] `pnpm check` is green.

## Slicing (2026-10-14)

Discovery against the tree at `f8c3ff24` found this ticket is four deliverables, and that
its inputs were handed forward unresolved (ADR-0154 §15: legacy facts with no schema home;
ticket 05: `rounds` and `magazineRef` have no representation; the candidate pipeline still
compiles the *legacy* placements and only validates through parts). Activation therefore
cannot be one honest edit. The slices land in order as additive commits; **only 11d
changes content, pipeline or compatibility version**, so no intermediate commit can
violate the single-change rule (AC 5).

| Slice | Delivers | Acceptance criteria covered |
| --- | --- | --- |
| **11a** Fit completeness and barrier seam | Platform availability windows, loadout-entry identity with duplicate and containment-cycle checks, unlocked-technology wiring, `compileDesign` routed through `deriveAfterFit` when a fit context is supplied. Additive: absent a fit context, results are byte-identical. | AC 7, AC 8 |
| **11b** Schema homes and whole-catalogue part builders | Typed homes for the legacy facts of ADR-0154 §15, for `rounds`/`magazineRef` and for the design header; whole-catalogue (not per-placement) parts for every gun model, mount, ammunition, launcher, fitting, plant and material, with the inverse readers that rebuild today's runtime shapes; an exhaustive equivalence test over every nation × family × mount type × count. | prerequisite of AC 1–4 |
| **11c** Codemod | The deterministic writer, its property, idempotency and cross-process tests, run into a staging directory that no pack declares. | AC 1, AC 2 |
| **11d** Activation | Rewritten content, parts pipeline in production, compatibility 2.0.0 current, changelog, equivalence and golden re-pin record, snap, `pnpm check`. One commit, explicit pathspec. | AC 3, 4, 5, 6, 9, 10 |

### 11a (2026-10-14) — implemented

- Platform `lifecycle`, loadout-entry `id`, and the fit checks and codes of ADR-0154 §18
  (`partFit.ts`); tests in `partFitCompleteness.test.ts` (windows incl. exclusive end,
  duplicate id, in-memory cycle, unlocked technology).
- `compileDesignThroughFit` (`compileThroughFit.ts`): seam test proves no derivation runs
  for `REJECTED`/`NOT_EVALUABLE` and the outcome has no derived metric field.
- **Deviation:** AC 7 says "`compileDesign` routes loadout derivation through
  `deriveAfterFit`". `compileDesign` returns a `CompiledDesign` whose ledger and hull are
  required, so it cannot represent "no metrics". The barrier is a wrapper that production
  calls (wired in 11d); `compileDesign` is its `derive`. Recorded in ADR-0154 §18.
- AC 7 and AC 8 are satisfied at the seam; production wiring is confirmed in 11d.

### 11b (2026-10-14) — implemented

- Schema homes (content-schema `ship-parts.ts`, ADR-0154 §19): `engineering`
  (`physical.envelopeHeightMm` + `centreOfGravity.zMm`/`PART_BASE`, `power` generation vs
  consumption, `cooling` demand vs supply, `maintenance`), the closed `capabilities`
  discriminated union, `entryUnits`, `metadata.tags` (`PART_TAGS`), the design header
  (`DesignHeaderSchema`/`DesignLoadoutSchema`), `magazineEntry`, gun `parameters.rounds`, and
  the reusable quantity kinds `lengthMm`/`powerKw`. Prototypes may not redefine the new blocks.
- Whole-catalogue builder `partCatalogue.ts` (`buildPartCatalogue`): every gun model, mount
  count, ammunition pattern, launcher variant, fitting, plant and armour material; central
  batteries canonical by (family, gun count); deterministic ids/order; duplicate id fails;
  `PART_SOURCE_FIELDS` documents one destination per source field.
- Inverse readers `partCatalogueReaders.ts`: gun/tube/fitting entry → `PlacementSpec`, plant
  entry + header → `MachineryPlan`, armour entry → `ArmourRegion`, header + loadout →
  `DesignDraft`; typed `READER_*` failures, no guesses.
- The equivalence candidate compiles the placements its parts rebuild, not the original legacy
  placements; `changed` stays 0 and the report/gates are unchanged.
- Tests: `partCatalogue.test.ts` (coverage, strict decode, round-trip, determinism,
  duplicate-id failure) and the manifest gate in `equivalenceHarness.test.ts`; the
  cross-process determinism script now proves both the report and the catalogue byte-identical.
- **Deferred to 11c/11d:** the codemod writer and production pipeline activation. No production
  content, save version or compatibility version changes here.

### 11c (2026-10-14) — implemented

- **Data-quality classification verified and corrected.** Three independent counts: **162
  unresolved armament/gun placements** (all `PART_READ_PATH_NO_FIRST_CLASS_ARMAMENT`, the
  documented compatibility path), **0 unresolved `FIT_MAGAZINE_*` relationships**, **0 applied
  waivers**. Earlier reporting mislabelled the 162 as magazine relationships;
  `equivalenceHarness.test.ts` now pins each count separately so the classification cannot
  drift behind a zero-difference equivalence result.
- `@bluewave/content-codemod` (new package, developer tooling): `planFromLegacy` /
  `planFromStaged` (pure), `loadLegacySource` / `readStagedSource` (I/O boundary) and
  `publishMigration` (atomic, temp-cleaned, collision- and path-safe). Emits
  `parts/<family>.yaml`, `platforms.yaml`, `slot-templates.yaml`, `designs/<nation>.yaml` and
  `manifest.json` (`ship-part-content-migration/1`: schema, source identity, file paths,
  record counts and per-file/tree hashes).
- Deterministic: 306 parts, 91 designs, 823 placements (230 gun / 28 tube / 565 fitting);
  byte-identical across runs, fresh processes and input order; source → staged → staged is a
  fixed point; every generated record strictly decodes from the emitted bytes; typed,
  path-specific failures for incomplete or unsupported input; no production content, save
  version or compatibility version changes.
- Tests: `packages/content-codemod/test/{codemod,publish,determinism,equivalence}.test.ts`
  (29 tests) plus `scripts/verify-codemod-determinism.mjs` (wired into `pnpm preflight`).
- **Deferred to 11d:** production activation, the pipeline switch, the save bump, the
  changelog, the equivalence/golden re-pin record and the snap.

### 11d (2026-10-14) — implemented

- **Activated content.** The 11c codemod output is committed under
  `content/production/1880/ship-building/` (`parts/` 306, `platforms.yaml`, `slot-templates.yaml`,
  `design-loadouts/` 91) and declared in `pack.json` (`parts`/`slotTemplates`/`platforms`/
  `designLoadouts`). The artifact's `shipBuilding.partModel` carries 306 parts / 5 platforms / 11
  slot templates plus 91 `designLoadouts`; the content lock is refreshed (0.5.0, bodyHash
  `49469d8d…`) and the 23 inherited non-gun placeholders are on the justified allowlist.
- **Compiler.** `PartSchema` accepts the codemod's already-flattened records (optional `origin`,
  passed through by the flatten stage); `designLoadouts` is a new strictly-decoded collection.
  The `DQ-TORPEDO-001` `forPart` reference is deferred until a pack declares a torpedo part (P4).
- **Production barrier.** `compileDesignFromLoadout` rebuilds a draft from `header`+`loadout`,
  fits, and derives only through `deriveAfterFit`; `buildShipBuildingContent` rebuilds reference
  designs from the loadouts. `compileProduction.test.ts` and `productionPartsContent.test.ts`
  prove all 91 designs / 823 placements compile from the activated content equal to the legacy
  compile, that the four D17 designs execute through the barrier, and that an invalid loadout
  yields fit information and no derived metrics.
- **Compatibility 2.0.0 + offline migration.** `CURRENT_COMPATIBILITY_VERSION` and the desktop
  version become `2.0.0`; `saveMigration.ts` + `tools/migrate-dev-saves` add the offline,
  version-keyed migration with fixtures for supported-old (1.2.0), already-current (2.0.0),
  malformed, unknown-prior and future saves. See ADR-0154 §21.
- **Equivalence and goldens.** `pnpm check:equivalence` is byte-identical across processes
  (`changed` 0, `orderingOnly` 0, D18 reclassified only); the golden is re-pinned for the four
  version-bearing hashes and `scripts/golden-repin.baseline` advances to the pre-11d tip.
- `pnpm check` is green.
