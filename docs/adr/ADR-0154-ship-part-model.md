# ADR-0154: One part model for ships — platforms declare slots, parts plug in through stable interfaces

## Status

Accepted (2026-10-13). Implemented in phases; this ADR is filed with phase P0
(ship-part-model ticket 01). The visual-trait definitions (D16) are still under owner
review; they gate only P6 and ship-visualization INC-4.

## Context

Ship parts are authored in seven differently shaped sources with six encodings of time:

- formula components;
- a separate armament catalogue;
- national override maps;
- torpedo constants in combat code;
- plants in their own file;
- armour materials in balance tables;
- ship types in code.

A gun can be authored in up to three places. Hull forms have zones but no mount points.
`barrels` means guns in one turret for turrets, but guns in a whole battery for deck and
casemate guns. Mount type is never chosen, so nine central-battery placements resolve as
3- to 6-gun turrets and barbettes. Three nations' structured torpedo diameters disagree
with the 356 mm torpedo their launchers fire. `upgradePath` is never read.

The 1880 content has 91 reference designs with 823 placements (230 gun placements,
28 torpedo-tube placements). The full design, decision log (D1–D19), invariants
(I-1–I-27) and translation tables are in `.scratch/ship-part-model/proposal.md`
(revision 4.1). The buildable requirements (SPM-R1–R26) are in
`.scratch/ship-part-model/spec.md`.

## Decision

1. **Parts.** Every fittable thing is a part: one strictly decoded record with a family,
   one provided interface from `interfaces/1`, a lifecycle, dated revisions, an optional
   one-level same-family prototype (`extends`), nested slots, quantity components with
   explicit application bases, optional visual metadata, and provenance. Engineering
   dimensions come only from structured fields, never from display names.
2. **`interfaces/1` is closed.** It has 14 exact, case-sensitive tokens, with no wildcard
   or catch-all. Calibre, diameter, side, station, arc, enclosure, date, nation, quantity
   and visual form are constraints or metadata, never interface identity. Adding a token
   needs a concrete provider–consumer case; removing or redefining one is a breaking
   `interfaces/2`. Each family may provide only its own interface; `fitting` covers the
   six ship-system interfaces.
3. **Platforms and slots.** Platforms declare slots directly or through shared slot
   templates: accepted interfaces, `mountCount` bounds, placement, nominal arc, and
   constraints from a closed key set. Armour materials are accepted by armour-region
   slots. There is one way to write each shape: `accepts` is always a list, and nested
   loadout entries are always lists keyed by child slot id. This replaces the scalar
   forms in the proposal's illustrative sketches (§3.3, §3.6). `quantities` may be
   absent on a part with no mass, cost, crew, volume or footprint of its own.
4. **Loadouts and quantities.** A loadout of entries replaces placements, the plant id
   and armour materials. `mountCount` is the only quantity field on an entry, and
   `gunsPerMount` is a gun-mount spec field. An absent `mountCount` means one unit
   (`DEFAULT_MOUNT_COUNT`). The compile stage applies that default, not the decoder,
   because every Effect decode default takes an `Effect` and `@bluewave/content-schema`
   is runtime-free (ADR-0128). Contained units are derived. `barrels`
   and `tubes` exist in no schema.
5. **Application bases.** Every quantity component declares `PER_LOADOUT_ENTRY`,
   `PER_PART_UNIT` or `PER_CONTAINED_UNIT`. The legacy gun fixed installation is
   `PER_LOADOUT_ENTRY`, to preserve today's calculation. Entry boundaries are semantic,
   and changing a basis needs an approved diff. `PER_FIT` and `PER_MOUNT` are draft
   aliases that no schema accepts.
6. **Central batteries.** The nine legacy central-battery placements migrate as one
   battery assembly each (`mountCount: 1`, `gunsPerMount: n`, `BROADSIDE_BATTERY`). The
   legacy resolution survives only as migration provenance, and the identity change is
   reported as `reclassified`.
7. **Time.** Availability, `requires`, dated revisions and `supersedes`. Refit
   compatibility comes only from slot acceptance and constraints, never from
   supersession.
8. **Ship types and torpedoes** become content. Ship types reference closed, code-owned
   engine behaviour classes. Torpedoes are parts fired from single-tube launchers. Combat
   keeps every algorithm.
9. **Rendering** reads `visual-traits/1`, with precedence override → trait → interface
   family → missing-asset glyph. Visual metadata never reaches simulation. Until D16's
   definitions are approved, a part's `visual.traits` admits no key, so an authored
   trait fails decoding rather than being dropped.
   Strict-decode diagnostics name the source file and field path. The one exception
   is a record whose `family` matches no member: it is reported at the record root,
   with a message listing the families, because a pre-union gate would need a
   transformation module the runtime-free package may not import.
10. **Legacy exceptions** are a closed, migration-only set (`DQ-TORPEDO-001`). Each one
    waives exactly one named constraint (`diameterUmEqualsBore`) for one named
    counterpart part, and carries a note. Because that constraint belongs to a launcher,
    "migrated records only" (SPM-R7) is enforced as: a legacy exception decodes on a
    `torpedo_launcher` record only, and fails at `legacyExceptions` on any other family.
11. **Saves.** Compatibility is decided before deserialisation. Incompatible saves are
    refused, never translated. The 2.0.0 gate is built in P2 and activated in the same
    change as the content and pipeline switch.
12. **Migration is phased (P0–P7).** Each phase is accepted only on structural and
    semantic equivalence over the full reference-design coverage. Inherited data-quality
    findings (DQ-TORPEDO-001, DQ-ARMAMENT-001) are reported apart from differences.
13. **P0 lands without behaviour change.** Part, slot-template and platform files are
    declared in the pack manifest under `shipBuilding.parts`, `shipBuilding.slotTemplates`
    and `shipBuilding.platforms`. They are decoded strictly and duplicate-id checked, but
    they do not enter the bundle until the flatten stage and part index (P1). The
    compiled artifact and its hash are unchanged.
14. **Flatten stage and part index (2026-10-13, ticket 02).** A pure `flatten` compiler
    stage runs between validation and normalization.
    - **Prototypes.** A variant writes `spec` as a delta: every spec field is optional
      when `extends` is present, and a standalone part must write every required
      field. Following proposal §3.7 ("`spec` and `quantities` values only"), the
      variant inherits `spec`, `quantities`, `slots`, `parameters` and `visual`. It may
      override a quantity's `value`, but not its `kind` or `basis`. It may not add a
      component, and it may not redefine `slots`, `parameters` or `visual`. Its
      identity, lifecycle, revisions, legacy exceptions and provenance are its own.
      **Revisions are never inherited**, because a re-rating is a dated fact about one
      part. A variant that shared one re-declares it with its own provenance. The
      variant's base spec is the prototype's base spec plus the variant's delta.
    - **Revisions** are cumulative deltas, sorted by `from` and then by declaration
      order. At a month, every revision up to that month applies, and the last one
      applied is the effective revision (`"base"` when none applies).
      `resolvePartRevision` checks neither availability nor `requires`; those are fit
      findings.
    - **Failures.** Each one is an error that names the file and the field path:
      `PART_EXTENDS_DEPTH`, `PART_EXTENDS_FAMILY`, `PART_EXTENDS_CYCLE`,
      `PART_VARIANT_INTERFACE`, `PART_VARIANT_KIND`, `PART_VARIANT_BASIS`,
      `PART_VARIANT_QUANTITY`, `PART_VARIANT_FIELD`, `PART_REVISION_DUPLICATE` and
      `PART_SUPERSEDES_CYCLE`. An unknown slot template, hull form, `extends`,
      `supersedes`, `forPart` or technology is a `REF` error.
    - **The index** is carried as `shipBuilding.partModel`: parts by id, part ids by
      interface and by family, a lineage graph, slot templates and platforms, all in
      codepoint order. It is present only when the pack declares part-model content,
      so a pack without it keeps its body hash and lock.
    - **Provenance.** Each flattened part records its `origin`: its source file and,
      for a variant, the prototype together with the spec fields and quantities it
      inherited. Paths are relative to the content root with `/` separators, so the
      hash does not depend on the checkout path. Part provenance is in the confidence
      report and the placeholder gate (ADR-0147).
15. **Legacy formulas become quantities (2026-10-14, ticket 05).** A part has no
    formulas, so the read path (and P2's codemod) translates a component's mass, cost,
    crew, volume and deck-footprint formula only when it is affine in one declared count
    parameter over that parameter's whole range. The count-independent term becomes
    `PER_LOADOUT_ENTRY`. The per-count term takes the slice's per-unit basis:
    `PER_CONTAINED_UNIT` on a gun mount (§9.2), and `PER_PART_UNIT` on a launcher or
    fitting. A one-unit component's constant is `PER_PART_UNIT`. A fitting's count
    parameter (the quarters' `blocks`) is read as the entry's `mountCount`, because
    `mountCount` is the only quantity field. A formula that reads another parameter, is
    not affine, or gives a negative or fractional term is a coded read failure, never a
    guess. Propulsion plants are parametric parts with `installedKw` as their one
    parameter and no quantity components: the machinery stage derives their mass and
    volume from the spec. Facts the part schema has no field for yet stay on adapter-side
    records, never on a part. These are component height, centre of gravity, electrical
    and cooling load and other attributes, the room split and fuel load of a machinery
    plan, and the citadel and bunker figures. The codemod (ticket 11) needs a schema
    home for each one before it can retire the legacy source.
16. **Fit validation (2026-10-14, ticket 06).** `validateLoadoutFit` is a pure stage that
    runs before any derivation and returns `ACCEPTED`, `REJECTED` (findings) or
    `NOT_EVALUABLE` (data issues); expected failures never throw.
    - **Order and meaning.** Slot exists, then interface and constraints on the spec
      resolved at the design month, then `mountCount` bounds, lifecycle, national access
      and placement. A nested slot's bounds are per installed parent unit, so a mount's
      `guns` slot `{n,n}` holds `n × mountCount` guns. Findings sort by the SPM-R12 code
      order, then by an identifier-based path, so input order never matters.
    - **Codes.** Beyond SPM-R12, three distinct failures get codes: `FIT_UNKNOWN_SLOT`,
      `FIT_COUNT_BELOW_MINIMUM` (a declared `min`) and `FIT_PLACEMENT`. A constraint a
      part cannot answer (a calibre on a torpedo) is a data issue, not a pass.
    - **Readings chosen.** Slot calibre bounds are whole inches compared exactly in
      micrometres. A mount's calibre is its nested guns'. `massKgMax` is the entry's own
      part components at their basis multipliers. `sameParts` requires one part in the
      slot; `mirrors` resolves to the sibling's definition and does not enforce mirrored
      fill. A `DQ-TORPEDO-001` waiver is honoured only on a `torpedo_launcher` parent, for
      the named torpedo and the named constraint, and is reported as an applied waiver.
    - **Stricter wins** (ADR-0089) by checking both: a platform cap violation is
      `FIT_CONSTRAINT_VIOLATED`, a national cap violation is `FIT_NATION_ACCESS`.
    - **Side inputs, not schema fields.** The nation's caps and denials, the
      ammunition-to-gun compatibility facts and the legacy count ranges arrive as typed
      inputs. Platform lifecycles, entry ids and an unlocked-technology set have no
      representation yet; `requires` is not evaluated.
    - **Magazines.** An entry carrying nested ammunition reports `FIT_MAGAZINE_AMBIGUOUS`
      or `FIT_MAGAZINE_UNDETERMINED` in `unresolved` when its feeding magazine is not
      unique. Nothing is chosen and no rounds are created (tickets 08 and 11).
    - **Barrier.** `deriveAfterFit` is the stage-level seam, implemented and tested.
      `compileDesign` is not wired through it; production enforcement, and the platform
      availability windows, entry identity and cycle checks and unlocked-technology
      requirements that the model cannot yet express, are follow-up work owned by
      ticket 11 (queries in 07). P1 changes no result.
17. **Part queries (2026-10-14, ticket 07).** `resolvePart`, `availableParts`,
    `partsForSlot`, `lineage`, `validateLoadout` and `loadoutCost` are pure, id-ordered
    reads of a `PartCatalogue` in `partQueries.ts`.
    - **Technology.** `FitInput.unlockedTechnologies` is the unlocked-technology input
      (also on `availableParts` and `validateLoadout`). A part whose `lifecycle.requires`
      is not covered is `FIT_TECHNOLOGY_LOCKED` (`detail.missing`), sorted after
      `FIT_UNAVAILABLE`. Absent the input, technology is not evaluated.
    - **Slot acceptance** is by interface and constraints on the part alone; constraints
      needing other entries (a mount's calibre) are `undecided`, not accepted.
      Lifecycle, nation and technology are `availableParts` concerns.
    - **Cost.** A nested entry's units are its parent's units times its `mountCount`; the
      multiplier comes from each component's declared basis.
18. **Fit completeness and the production barrier (2026-10-14, ticket 11a).**
    - **Platform windows.** A platform may declare `lifecycle` (`availableFrom` inclusive,
      `availableUntil` exclusive). Outside it the fit is `FIT_PLATFORM_NOT_YET_AVAILABLE` or
      `FIT_PLATFORM_UNAVAILABLE`, sorted before every other finding. Absent, always available.
    - **Entry identity.** An entry may carry an `id` (lower snake_case). Ids are unique across
      the whole loadout, nested entries included; a repeat is `FIT_DATA_DUPLICATE_ENTRY_ID`.
      A decoded loadout is a finite tree, so a containment cycle cannot be authored; an
      in-memory cycle is `FIT_DATA_ENTRY_CYCLE` instead of a non-terminating walk. Both make
      the result `NOT_EVALUABLE`.
    - **Technology.** `FitInput.unlockedTechnologies` (ticket 07) is the evaluation of
      `requires`; production passes the design context's unlocked set.
    - **Barrier.** `compileDesignThroughFit` runs the fit check and reaches `compileDesign`
      only through `deriveAfterFit`. `compileDesign` stays the derivation itself, because its
      result type has non-optional derived fields and a rejected loadout must carry none.
      The production entry point (ticket 11d) calls the wrapper.
19. **Schema homes and the whole-catalogue part builders (2026-10-14, ticket 11b).** The
    legacy facts §15 had no home for, plus `rounds`/`magazineRef` and the design header, get
    typed, strictly decoded destinations. **No free-form legacy bag** and no flat engineering
    object: each fact states its meaning.
    - **`engineering`.** `physical` (`envelopeHeightMm`, and `centreOfGravity.zMm` with the
      explicit part-local datum `PART_BASE`) records axis (+z up), zero point (the part's
      mounting face at its installed position) and the transform owner (the loadout stage to
      ship z; identity today, because no slot declares a mounting plane). `power` separates
      `generation` from `consumption` structurally (never a sign); `cooling` separates
      `demand` from `supply`. Plants keep `installedKw` as their one parameter. A block is
      present exactly when the source authors it; a half-authored physical block is a
      `PARTCAT_PHYSICAL_INCOMPLETE` failure, never a guessed zero.
    - **`capabilities`** is a closed discriminated union on `kind` (`fire_control_class`,
      `fire_control_support`, `ammunition_feed`, `arc_obstruction`, `damage_control`), sorted
      and duplicate-free (no kind has a defined multiplicity). Fire-control class is a typed
      capability, not a generic tag.
    - **`metadata.tags`** is a closed vocabulary (`PART_TAGS`), duplicate-free and
      codepoint-sorted. Tags are discovery/grouping/presentation only; no fit rule, metric,
      cost rule or combat behaviour reads one.
    - **`rounds`/`magazineRef`.** `rounds` is a gun-part parameter, and its chosen value is
      the nested `guns` entry's `params.rounds` (the legacy compile's own default applies when
      the source omits it). `magazineRef` becomes the entry's `magazineEntry`, naming the
      entry (its `id`, the placement's instance id) that supplies the ammunition.
    - **Quantity kinds.** SPM-R5's reusable kinds extend with `lengthMm` and `powerKw` only;
      a quantity type names unit and magnitude, the containing field names meaning.
    - **The design header.** `DesignHeaderSchema` carries nation, requirement, hull, the
      machinery residue (fuel, fouling, room split) and the protection figures — the facts a
      loadout does not carry; `DesignLoadoutSchema` pairs it with the loadout.
    - **Whole catalogue.** `buildPartCatalogue` builds parts for the complete buildable
      catalogue, not only what the 91 designs place: every gun model (each family's standard
      model, every authored model, every catalogue-only profile model), every mount (each
      gun count of each type; a central battery is canonical by family and gun count, its
      legacy source type in provenance), every ammunition pattern, launcher variant, fitting,
      plant and armour material. Generated ids and order are deterministic; a duplicate
      generated id fails (`PARTCAT_DUPLICATE_ID`).
    - **Inverse readers.** `partCatalogueReaders.ts` rebuilds today's runtime shapes from the
      parts: a gun/tube/fitting entry back to its `PlacementSpec`, a plant entry plus the
      header back to the `MachineryPlan`, an armour entry back to its `ArmourRegion`, and the
      pair back to a whole `DesignDraft`. Incomplete input is a typed, path-specific
      `READER_*` failure, never a zero, `false`, empty list or guess. The equivalence
      candidate compiles the placements its parts rebuild, not the original legacy placements.
    - **Destinations.** `PART_SOURCE_FIELDS` documents one destination per source field the
      migration reads; a field with none is `PARTCAT_UNMAPPED_FIELD`, not a silent drop.
    - **Deferred.** Production activation and content rewrite are tickets 11c (codemod) and
      11d (activation); this decision changes no production content, save or compatibility
      version, and no result (equivalence `changed` stays 0).
20. **Staged content codemod (2026-10-14, ticket 11c).** `@bluewave/content-codemod` is a
    deterministic, staged-only writer over the 11b schema and builders. It plans the whole
    output tree in memory (parts, platforms, slot templates, one `DesignLoadout` per design)
    and publishes it atomically to an explicit staging directory; it never rewrites
    production content and changes no compatibility or save version. The writer refuses
    unsafe, ambiguous or protected output paths, detects destination collisions, fails with
    typed path-specific diagnostics for unsupported or incomplete input, and emits a
    `manifest.json` (schema, source identity, generated paths, record counts, per-file and
    tree hashes). A run is a pure function of its source: byte-identical across processes and
    input orders, and a fixed point — re-migrating a staged tree changes nothing.
    - **Data-quality classification, verified and corrected (2026-10-14).** The three counts
      are independent: **162 unresolved armament/gun placements** (all
      `PART_READ_PATH_NO_FIRST_CLASS_ARMAMENT`, the documented compatibility path), **zero
      unresolved `FIT_MAGAZINE_*` relationships**, and **zero applied waivers**. Earlier
      reporting had mislabelled the 162 as magazine relationships; the equivalence harness
      test now pins each count separately, so the classification cannot drift behind a
      zero-difference result.
    - **Deferred.** Production activation, the pipeline switch and the save bump remain 11d;
      this decision stages content only.

21. **Activation (2026-10-14, ticket 11d).** The deterministic codemod output (11c) becomes
    authoritative content and the production compile path runs through the fit barrier.
    - **Content.** The generated parts (`ship-building/parts/*.yaml`), platforms, slot
      templates and one `DesignReference` per design (`ship-building/design-loadouts/*.yaml`)
      are declared in `pack.json` under `shipBuilding.parts`/`slotTemplates`/`platforms`/
      `designLoadouts` and compiled into the artifact (`shipBuilding.partModel` 306 parts, 5
      platforms, 11 slot templates; 91 loadouts). The legacy `reference-designs/` stay declared
      as the equivalence baseline; production reads the loadouts.
    - **The codemod's flattened records are accepted as authored parts.** `PartSchema` admits an
      optional `origin`; a record that already carries one is accepted by the flatten stage as-is
      (prototype lineage read from `origin.prototype`) instead of re-inheriting a prototype. This
      lets the generated tree be the authoritative parts source without a second, hand-authored
      representation.
    - **`designLoadouts` is a new compiler collection**, strictly decoded with
      `ReferenceDesignLoadoutSchema` (id, name, month, optional `starterFor`, `header`, `loadout`),
      normalized in file order, and carried as `shipBuilding.designLoadouts` (optional, so a pack
      without it keeps its body hash).
    - **The torpedo waiver's `forPart` is a deferred cross-reference.** `DQ-TORPEDO-001` names a
      torpedo part; torpedoes arrive at P4. Until a pack declares a `torpedo` part, an unknown
      `forPart` is not an error (the waiver is only evaluated against a nested torpedo entry, and
      no P2 loadout carries one). Once a torpedo part is declared, the check is an error again.
    - **Production barrier.** `compileDesignFromLoadout` (`compileProduction.ts`) rebuilds the
      draft from `header`+`loadout` via the inverse readers, runs `validateLoadoutFit`, and reaches
      `compileDesign` only through `deriveAfterFit`; a loadout that does not fit or cannot rebuild
      exposes fit information and no derived metric. `buildShipBuildingContent` rebuilds reference
      designs from the loadouts (`referenceDesignsFromLoadouts`) when the pack carries them, and
      the desktop loader reads `partModel`/`designLoadouts` from the artifact. Tests
      (`compileProduction.test.ts`, `productionPartsContent.test.ts`) prove all 91 designs / 823
      placements compile from the activated content equal to the legacy compile, that the four D17
      designs execute through the barrier, and that an invalid loadout yields no metrics.
    - **Compatibility 2.0.0 and the offline migration.** `CURRENT_COMPATIBILITY_VERSION` becomes
      `2.0.0` and `apps/desktop` follows it (ADR-0134). The product still refuses a mismatched save
      (ADR-0113 §6, no runtime translation); `saveMigration.ts` adds the version-keyed transform
      and `tools/migrate-dev-saves` is the offline, explicitly-versioned developer tool. It detects
      the source version, migrates the supported 1.2.0 state by re-stamping the version and
      recomputing the envelope + `rawHash` (no field but the version changes; 1.0.0/1.1.0 stay a
      documented rejection), refuses future/unknown/malformed saves, validates before publication,
      writes atomically with the original preserved as `.tmp_migrated_<id>.from-1.2.0`, and is
      idempotent. Fixtures cover supported-old (1.2.0 corpus), already-current (2.0.0 corpus),
      malformed, unknown-prior and future saves.
    - **Golden re-pin.** The compatibility version is embedded in the save envelope, so the
      reference run moves: `initialSnapshotHash` `081cce36→6d3f417b`, `closingSnapshotHash`
      `5539aa54→5ce0a529`, `commandLedgerHash` `fed75149→3ccd7598`, `replayVerificationHash`
      `fa8aa389→f29a1dc8`; `contentArtifactHash`, the event/financial/random ledgers and
      `battleGenerationHash` are unchanged. `scripts/golden-repin.baseline` advances to the pre-11d
      tip (57771173), grandfathering six pre-existing commits that changed authoritative source
      without a trailer (verified: the reference run was green before 11d).
    - **Inherited placeholder provenance.** The non-gun catalogue (plants, armour materials,
      fittings, launchers) had no authored provenance; the parts migration surfaces it as
      `PLACEHOLDER`. The 23 affected records are admitted on the justified
      `placeholder-allowlist.json` pending a sourcing pass — a gate change recorded here, not a
      migration difference.

22. **Refit compatibility from slot acceptance (2026-10-14, ticket 14).** A refit may swap a part
    only for one the same slot accepts and whose constraints pass at the refit month; supersession
    never implies compatibility (I-7). `RefitKindRule.allowedCategories` becomes
    `allowedInterfaces: PartInterface[]`, and the kind check reads the touched part's provided
    interface, for both removals and additions (a gun placement resolves to its `gun` part; the
    legacy category fallback matches the part-model result only for the categories listed in
    `LEGACY_INTERFACE_BY_CATEGORY`, not universally for every gun or category).
    `evaluateRefit` additionally evaluates the platform's zone slot for **incoming added parts
    only** (`<zone>.<interface>`, `platformSlots` + `compatibilitySlotId`, applied over `plan.add`)
    with `evaluateConstraints`, emitting BLOCKING `REFIT_SLOT_REJECTED`; emptying a slot on
    removal is never judged against the slot's incoming acceptance, so a removal never emits
    `REFIT_SLOT_REJECTED` for the part taken out. It reads the compiled part model from the new
    optional `ShipContext.partModel` (attached by `environmentFor`). A new gate,
    `scripts/verify-no-upgradepath-refit-readers.mjs` (in `pnpm preflight`), fails if the
    refit/design-compile/production-compatibility modules read `upgradePath` or decide
    compatibility from `supersedes`. `evaluateRefit` has no production caller yet: wiring it into
    the refit flows is part of the phased plan, not this ticket.
    - **Deferred, recorded.** `interfaces/1` has no aviation token, so
      `AVIATION_CONVERSION.allowedInterfaces` is empty and an aviation-facility refit is rejected
      with `REFIT_KIND_MISMATCH` rather than silently allowed (D-9; the interface and its parts
      land with the aviation work at P7). The gun path receives the kind/interface validation only:
      a legacy gun placement resolves to the `gun` part, whose filling mount slot it does not name,
      so the generalized slot/constraint interface check is not applied to it (authored mount slots,
      and gun slot/constraint modelling for the primary REARMAMENT case, are P7). The authored
      `balance.yaml` `refit:` section keeps `allowedCategories`: it has no decoded reader (the
      desktop reads only `bulgeProtectionGainBp`), and renaming it would move the content-lock and
      golden content hashes, so it is renamed together with that re-pin, not here (D-10).
    - **No reader removal here.** The remaining `upgradePath` readers — the `partCatalogue`
      read-path migration to `supersedes`, `component.ts` `lintCatalogue`, and the content
      compiler's legacy validation — belong to the P1 read path that ticket 15 (P5) deletes with
      the legacy formats.

## Consequences

- One mechanism covers nine part families, platforms and ship types.
- Mass application is auditable per entry.
- Legacy misclassifications and national data inconsistencies become visible and
  preserved, and are correctable later by approved diff.
- Saves older than 2.0.0 stop loading at P2. No save has been released (ADR-0113).
- New code: the flatten stage, revisions, fit validation, basis-driven derivations, the
  equivalence harness, the queries, `CompiledTorpedo`, and the visual compile stage.
- `ComponentDef` guns, `componentVariants`, the profile gun overrides, the armament
  adapter, `upgradePath` and the combat torpedo constants retire at P5.
- The ADR-0148 visual keys are renamed to visual traits through an explicit map at P6.
- The glossary terms go into `CONTEXT.md`. Its word ceiling rises from 200 to 575 to
  hold them (`scripts/doc-budgets.manifest.json`): these are the domain terms every
  ship-part ticket uses, and splitting them out would leave the glossary incomplete.

## Alternatives considered

- **Keep the per-family catalogues and add mount points only.** Rejected: it leaves the
  seven shapes, the three-place gun authoring and the dual meaning of `barrels`.
- **One open `kind` string instead of closed families and interfaces.** Rejected:
  typos would ship as silently ignored rules, and content strings would select
  behaviour (I-16).
- **Translate old saves at load.** Rejected: ADR-0113 rejects on mismatch, and a
  half-translated campaign is worse than a clear refusal.
