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
    counterpart part, and carries a note.
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
