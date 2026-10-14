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
