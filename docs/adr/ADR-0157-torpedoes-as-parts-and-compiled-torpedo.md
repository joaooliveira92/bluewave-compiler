# ADR-0157: Torpedoes become parts, and the compiled torpedo contract

## Status

Accepted (2026-10-14). Filed with ship-part-model ticket 13, slice 13a (P4). Implements
ADR-0154 §8 for torpedoes and fixes the field list the ticket's authorization deferred to
this ADR (SPM-R17's enumerated interface). Slice 13b landed the same day; see
[§13b resolution](#13b-resolution-2026-10-14).

## Context

Torpedo performance is the last per-model data still defined only in code:
`packages/combat/src/torpedoes/model.ts`'s `TorpedoModelDefinition`/`SHIPPED_TORPEDO_MODELS`
(8 models) carries diameter, mass, warhead, propulsion, ordered speed/range settings, arming
distance, reliability, guidance, launcher families and oxygen/hazard policy. The part model
(ADR-0154) makes a `torpedo` a first-class family providing the `torpedo` interface, and the
launchers already declare a nested `torpedo` slot requiring `diameterUmEqualsBore`
(ticket 04). Until a pack declares a torpedo part, `DQ-TORPEDO-001`'s `forPart` is a deferred
cross-reference (ADR-0154 §21); declaring one makes an unresolved `forPart` an error again.

The P4 gate (SPM-R26) requires identical combat goldens and cross-process determinism. Slice
13b owns switching combat onto the compiled record and retiring the constants; slice 13a
establishes the representation and the compilation boundary, **additively** — combat still
reads its constants.

## Decision

1. **The torpedo part spec (`TorpedoSpecFields`, SPM-R17).** A torpedo part's `spec` carries,
   with names and magnitudes tracking the combat model so the compiled record is
   representation-preserving: `diameterUm`, `massKg`, `warheadType` (closed),
   `warheadExplosiveMassKg`, `warheadExplosiveEquivalentMassKg` (the value combat damages
   with), `propulsionType` (closed), `speedSettings` (an ordered non-empty list of
   `{ speedMilliKnots, rangeM }`), `minimumArmingDistanceM`, `reliabilityBp` (per 100,000),
   `guidanceCapability` (a stable id), `launchTypes` (the DESIGN-40 §2 mount types the torpedo
   may be launched from), `tubeHitHazardPolicy` (closed) and the optional
   `oxygenWakeVisibilityModifierBp` (the one per-model oxygen value; the five §23 constants
   are algorithm constants). The vocabulary mirrors are local to `@bluewave/content-schema`
   so it stays dependency-free of the engine, exactly as `TORPEDO_MOUNT_TYPE_VALUES` already
   is.

2. **`TORPEDO_SOURCE_FIELDS` is the torpedo source-field map.** Every authoritative
   `TorpedoModelDefinition` field has exactly one documented destination (the
   `PART_SOURCE_FIELDS` discipline); fields intentionally not carried (`ownerNationIds`,
   `productionRequirementId`, `depthKeepingProfile` — unread by combat — and
   `contentVersion`/`contentHash`) are marked `(none)`. `technologyPrerequisiteIds` is also
   `(none)` **but is read by combat's torpedo compatibility** (`torpedoes/compatibility.ts`);
   modelling or dropping it is a recorded 13b decision, not a claim that it is unused. The
   builder rejects an unmapped key as a typed, path-specific
   `TORPEDO_READ_PATH_UNMAPPED_FIELD`, so a new model field cannot be dropped silently.

3. **The builder and the catalogue.** `buildTorpedoPartModel` turns each authoritative model
   into one `family: torpedo` part, running inside `buildPartCatalogue` (so the content codemod
   emits `parts/torpedo.yaml`). Generated ids are the model ids, codepoint-ordered; a duplicate
   is `PARTCAT_DUPLICATE_ID`. Launch types are derived from the model's
   `compatibleLauncherFamilyIds` suffixes in canonical mount-type order. Each part carries the
   `torpedo_mass` quantity and provenance grounded in the torpedo research
   (`docs/research/ship-building-early-band-2.md`, `docs/research/c1-m3-torpedoes.md`) — not a
   `PLACEHOLDER`, so the placeholder gate is unchanged. The 1880 pack declares the eight
   shipped models with authored availability grounded in each model's introduction; the whole
   buildable torpedo catalogue is represented, not only the torpedoes the 91 designs place.

4. **`CompiledTorpedo` lives in `@bluewave/armament`** (a neutral leaf both `ship-design` and
   `combat` depend on), like `CompiledArmamentMount` (ADR-0093). It is the closed,
   unit-explicit record of part id, revision, diameter, warhead type/mass/equivalent, mass,
   propulsion, ordered speed/range settings, arming distance, reliability, guidance, launch
   types, hazard policy and the optional oxygen modifier. `compileTorpedo(part, month)` in
   `ship-design` produces it from a strictly decoded torpedo part: it resolves the part's
   revision at the month and validates every value, returning typed failures
   (`COMPILED_TORPEDO_NOT_A_TORPEDO`, `..._MISSING_FIELD`, `..._INVALID_FIELD`,
   `..._OXYGEN_STATE`) rather than guessing. Combat does not read it yet.

5. **The 1884 Whitehead revision.** The 14-inch Whitehead 1877 pattern carried a 26 lb (12 kg)
   wet-guncotton charge; the 1884 Mk IV re-rated it to the 58–70 lb (26–27 kg) charge the
   shipped model carries. The part's **base** spec carries the first-pattern warhead (12 kg); a
   dated revision at `1884-01` restores the model's current warhead (27 kg) with its own
   `VERIFIED` provenance. So resolving before/after 1884 changes the warhead and names the
   revision (`resolvePartRevision`/`query` and `CompiledTorpedo.revision`), and the part's
   post-1884 spec equals the authoritative constant. Availability is 1880-01 (the
   `torp_whitehead_torpedo` technology's year), so the 1877–1884 pattern is available to the
   reference designs.

6. **Launcher compatibility and waivers are unchanged in policy.** The launchers keep their
   nested `torpedo` slot and `diameterUmEqualsBore`; the 17 national variants and the five
   `DQ-TORPEDO-001` waivers are untouched. Declaring torpedo parts makes every waiver's
   `forPart` resolve to a real, strictly decoded torpedo part (an unresolved one is a `REF`
   error again). No waiver is widened, no launcher validation is weakened, and the
   production loadouts carry no nested torpedo, so the data-quality counts (0 applied waivers,
   5 waiver-bearing launcher records, 9 affected torpedo entries) are unchanged.

## Consequences

- The content artifact gains `parts/torpedo.yaml` (8 records); the committed content lock is
  refreshed (`bodyHash` `5a7ab05b…` → `4083aa93…`). The equivalence report is byte-identical
  (`ebd0ddb6…`, zero `changed`): the candidate pipeline compiles placements, and torpedoes are
  not placements. Campaign goldens are unchanged.
- The buildable torpedo catalogue currently mirrors the shipped `torpedo_models_v1` set. The
  engine-side fields with no content home (`ownerNationIds`, `technologyPrerequisiteIds`,
  `productionRequirementId`, `depthKeepingProfile`) are documented `(none)`: their
  technology/lifecycle semantics and the depth-keeping profile are **deferred to 13b**, which
  must decide whether to model them or drop the constants.
- **Deferred to 13b:** combat reads `CompiledTorpedo` and the per-model constants retire with
  a grep/no-reader gate; the P4 combat goldens and cross-process determinism are proven there.
  The 1 kg difference between the Mk IV citation (26 kg) and the shipped constant (27 kg) is
  resolved in favour of the data-model value so the part's post-1884 spec is the constant.
  **Effective-month decision (must be recorded in 13b):** the reference designs and the
  battle-resolution child read the 14-inch at 1880 (before the 1884 re-rating), so a
  design-month compile yields the 12 kg first pattern, not the 27 kg constant. 13b must decide
  the month the compiled torpedo is resolved at (the model's effective revision, or the design
  month with a reviewed, re-pinned combat change) rather than silently assuming the goldens
  stay identical. `technologyPrerequisiteIds` (read by `torpedoes/compatibility.ts`) likewise
  needs a model-or-drop decision.
- **Do not** claim combat is parts-driven until 13b switches it.

## 13b resolution (2026-10-14)

Slice 13b is complete: combat reads `CompiledTorpedo` and the per-model constants are gone. Recorded here because §Consequences deferred these decisions to 13b.

1. **Combat reads the compiled record; the constants are deleted.** `packages/combat/src/torpedoes/model.ts` (`TorpedoModelDefinition`, `SHIPPED_TORPEDO_MODELS`, `torpedoModelById`, `TorpedoSetting`, `OxygenTorpedoState`, the `torpedo_models_v1` contract) is removed. Every read now goes through a `CompiledTorpedoRegistry` threaded on the battle input (`TorpedoContext.torpedoes`, keyed by part id; `torpedoes/registry.ts`), built by `torpedoProjection` from the design's compiled snapshot. `torpedoModelById`'s fail-closed semantics survive as `compiledTorpedoOf`.
2. **Effective-month decision (D1).** The compiled torpedo is resolved at the model's **effective (latest) revision** (`compileTorpedo(part, "9999-12")`: base spec plus every revision folded), *not* the design month. This reproduces the shipped constants exactly — the 14-inch Whitehead yields the 1884 Mk IV 27 kg charge, not the 1877 12 kg first pattern — so combat goldens and cross-process determinism stay byte-identical. The design-month alternative (12 kg, re-pinned goldens) is rejected: P4 demands identical combat output, and the revision is a representation of the model's current state, not a per-design month query.
3. **`technologyPrerequisiteIds` is modelled (D2).** It is added to `TorpedoSpecFields` and `CompiledTorpedo`, populated by the builder from the authoritative models, and read by `compatibility.ts`'s `platformTechnologyAndAdoption`. `ownerNationIds`, `productionRequirementId`, `depthKeepingProfile`, `contentVersion` and `contentHash` stay `(none)`: they are unread by combat and are dropped with the constants. `TORPEDO_SOURCE_FIELDS` reflects this.
4. **Launcher-family membership is re-expressed as mount type + physical bore.** The neutral record carries DESIGN-40 §2 `launchTypes` and `diameterUm`, not the retired exact `compatibleLauncherFamilyIds` string set (whose unit label — `21in` vs `533mm` — is not in the contract). `launcherFamilyMatches` therefore accepts a launcher family whose mount type the torpedo declares **and** whose physical bore equals the torpedo's. A same-bore alias (`533mm_above_water_trainable` for a 533 mm / 21-in model) now matches where the exact string set rejected it; an undeclared mount type or a different bore still fails closed. This is a deliberate, deterministic re-expression of the physical fit, pinned by a test in `test/torpedo/compatibility.test.ts`; it is the only predicate whose acceptance boundary moved, and it is not on the golden path.
5. **The compiled snapshot rides on the design version.** `ComponentSummary.torpedoMount.compiledTorpedo` (ship-design) → `EngineDesignFields.torpedoArmament[].compiledTorpedo` → `CompiledTorpedoMount.compiledTorpedo` (campaign) → phase-engine `buildDesignVersion`. The campaign hash surface **excludes** the snapshot (`hashableTorpedoArmament`: only the three identity fields), so campaign goldens and saved-design hashes are unmoved; the ship-design `CompiledDesign.hash` includes it (it covers the component summary). Both the parts read path (`partCatalogueReaders.readPlacements`) and the legacy compile path (`buildDesignVersion` via `pricingFor`'s `torpedoOf`) attach it, so authored **and** player/AI-built designs resolve identically — closing the `BATTLE_AUTO_RESOLUTION_FAILED` gap a parts-less design would otherwise hit. A launcher whose named torpedo cannot be compiled reports `READER_TORPEDO_UNRESOLVED` rather than silently dropping it.
6. **The no-reader gate.** `scripts/verify-no-torpedo-model-constants.mjs` (wired into `pnpm preflight`) fails if any retired symbol returns to `packages/combat/src`, and fails if a `CompiledTorpedo` sample record literal appears outside the two cross-process test harnesses (`src/simulation/run-*-child.ts`), which carry sample inputs to drive determinism children. The combat **engine** therefore holds no per-model torpedo data.
7. **Deferred / dropped, recorded not silent.** `ownerNationIds`, `productionRequirementId`, `depthKeepingProfile` are dropped (unread). `TORPEDO_MODEL_FUZE_POLICY` (`detonation.ts`) remains a keyed combat algorithm constant — the fuze is not a `CompiledTorpedo` field and 13a left it out; `SEED_TORPEDO_MODEL_IDS` remains for the surviving `TorpedoContract`/fuze key-set pin. The P4 equivalence report is byte-identical (`ebd0ddb6…`, zero `changed`, 91/91 designs, 823/823 placements), the 11 campaign goldens are unchanged, and cross-process determinism passes.

## Alternatives

- **A free-form metadata or attributes bag for torpedo data.** Rejected: ADR-0154 forbids it,
  and behaviour-bearing values must be typed fields (I-16).
- **`CompiledTorpedo` as an alias over the combat constants.** Rejected: it must be a genuine
  parts-derived contract, produced from a strictly decoded part.
- **Building only the torpedoes the 91 designs place.** Rejected: the whole buildable
  catalogue must be represented (SPM-R17).
