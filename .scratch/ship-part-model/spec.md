# Spec: one part model for ships (`ship-part-model`)

One-line purpose: replace the seven differently shaped ship-part sources with one
catalogue of **parts** that plug into **platform slots** through stable **interfaces**.
Quantities, mass-application bases and the passage of time become explicit, and every
existing 1880 reference design keeps exactly its current results.

**Triage:** `ready-for-agent`: fully specified and ready for an AFK agent. In this repo
that means the implementation tickets, once sliced by `to-tickets`, carry
`Status: open`, `Frontier: yes` and a resolved `Blocked by:` chain
(`docs/agents/triage-labels.md`). P1 is authorised now. Every P2 design decision is closed.
P6 (visual alignment, which includes ship-visualization INC-4) waits on the owner's review
of the exact visual-trait definitions.

**Status:** sliced into 16 tickets at `issues/` (02 and 03 are resolved and 04–06 are the frontier; P1 = 01–09; 2.0.0 is implemented in 10 and activated atomically in 11, P2 = 10–11, P3 = 12, P4 = 13, P5 = 14–15, P6 = 16, gated on D16).

**Source of truth:** the approved design proposal [`proposal.md`](proposal.md)
(revision 4.1) and its decision log D1–D19, invariants I-1–I-27, safeguards S1–S8 and
T1–T6, and reclassification rules R1–R7. This spec turns that proposal into buildable
requirements. Where they differ, the proposal's decisions win and this spec is corrected.

**Grounds:**

| ADR | Covers |
| --- | --- |
| ADR-0004 | Compiler stages |
| ADR-0089 | National profiles restrict, never widen |
| ADR-0093 | Armament domain; Steps 3–4 complete |
| ADR-0100/0128 | Runtime-free packages |
| ADR-0105/0143 | Strict Effect Schema decode at the boundary |
| ADR-0113 | Save compatibility: reject on mismatch |
| ADR-0122/0123/0145 | Content artifact, identity, lock |
| ADR-0136 | Golden re-pin guard |
| ADR-0146 | Codepoint ordering |
| ADR-0147 | Machine-checked provenance |
| ADR-0148 | Ship-visual part catalog |

The proposal's draft ADR is filed alongside this spec's first ticket.

---

## Problem Statement

A designer, a content author or an agent working on Bluewave's ships cannot answer basic
questions from the content:

- what fits in this position;
- what was available in 1895;
- what replaced this part;
- what does this loadout cost or weigh, and why.

The answers are scattered across seven differently shaped sources:

- formula-based components;
- a separate first-class armament catalogue;
- national override maps;
- torpedo constants in combat code;
- plants in their own file;
- armour materials hidden in balance tables;
- ship types defined in code.

Time is written six different ways. A gun can be authored in up to three places, and
changing it means keeping them consistent by hand.

The model itself is ambiguous:

- **No mount points.** Hull forms have zones, not mount points, so "zero to three forward
  main mounts" cannot be expressed or validated.
- **`barrels` means two things.** It is guns in one turret, but guns in a whole battery for
  deck and casemate guns. A per-placement fixed mass hides the difference.
- **Mount type is never chosen.** It is taken as the gun model's first option. As a
  result, nine central-battery ironclad placements masquerade as 3- to 6-gun turrets and
  barbettes.
- **Hidden data issues.** Three nations' launchers carry torpedo diameters that disagree
  with the 356 mm torpedo they actually fire, and nothing reports it.
- **Dead succession data.** The only succession mechanism, `upgradePath`, is never read.

For the player the result is invisible but real. The ship designer cannot offer
meaningful mount positions, the mount type cannot be chosen, the drawings guess at mount
arrangements, and every future content addition risks silently changing existing ships.

## Solution

Ship parts become one catalogue of self-contained **part** records:

- Each record carries one **part family** and one provided **interface** from a closed,
  approved vocabulary.
- It has a **lifecycle** (availability window, technology prerequisites, succession) and
  dated **revisions** for re-ratings of the same part.
- It may use one-level **prototypes** for national variants.
- It may have nested **slots** when it is an assembly (a gun mount holds guns and
  ammunition; a launcher holds torpedoes).
- Its **quantity components** each declare how they scale.

Hull forms become **platforms** that declare **slots**. A design is a **loadout** of
entries that fill slots, each with an explicit `mountCount`. A gun mount part states its
`gunsPerMount`, and the compiler derives total guns. Every mass, cost, crew, volume and
footprint component declares its **application basis** (`PER_LOADOUT_ENTRY`,
`PER_PART_UNIT`, `PER_CONTAINED_UNIT`).

The compiler:

- flattens prototypes and resolves revisions for the design month;
- validates loadouts before any derived calculation;
- emits a part index with provenance back to the source part, revision and file;
- answers availability, slot-fit, lineage, validation and cost through pure queries.

**Ship types** and **torpedoes** move into content, while every classification and combat
algorithm stays in code behind closed enums and a narrow compiled-data interface.

The change lands in phases:

1. A new read path over today's content proves that it produces **identical results** for
   all 91 reference designs (823 placements), through a committed, machine-readable
   equivalence report.
2. A one-shot, deterministic content rewrite follows, under the same zero-difference gate.
   Its only allowed non-numeric differences are the nine approved central-battery
   reclassifications.
3. Old saves are refused at that point, not translated.
4. Ship types, torpedoes and legacy retirement follow, each behind its own report.
5. Rendering is aligned to explicit visual traits once their definitions pass review.

## User Stories

### Content authors

1. As a content author, I want to add a new gun as a single record, so that I never have
   to keep two or three files consistent by hand.
2. As a content author, I want a new part to be found by every slot whose interface and
   constraints it satisfies, so that I never maintain compatibility lists.
3. As a content author, I want a national gun or launcher variant to inherit its parent and
   override only the values that differ, so that national content is a small, reviewable
   delta.
4. As a content author, I want the schema to stop a variant from changing its parent's
   interface, family, field meaning or quantity basis, so that a national variant cannot
   silently alter engineering semantics.
5. As a content author, I want to record a re-rating of the same part (for example the 1884
   Whitehead warhead) as a dated revision with its own provenance, so that history lives in
   data instead of YAML comments.
6. As a content author, I want to mark a part as superseded by its successor, so that "what
   replaced this?" is answerable without reading comments.
7. As a content author, I want one way to write availability and technology prerequisites
   for every family, so that I don't have to remember six encodings.
8. As a content author, I want unknown interfaces, constraint keys, bases, legacy-exception
   codes or visual trait values to fail decoding, so that a typo never ships as a silently
   ignored rule.
9. As a content author, I want every quantity component to state its application basis, so
   that mass and cost scale exactly as I intend and reviewers can see it.
10. As a content author, I want armour materials to be catalogue parts with dates, technology
    and efficiency, so that armour availability is content rather than a balance-table key.
11. As a content author, I want propulsion plants to be parametric parts with installed power
    as a parameter, so that machinery follows the same mechanism as every other family.
12. As a content author, I want torpedoes to be parts with dimensions, warhead, speed
    settings, reliability, cost and mass, so that torpedo history is authored where the rest
    of the equipment is.
13. As a content author, I want ship types to be content records naming their era
    availability, roles, doctrine tags, classification parameters, AI weights and
    presentation, so that historical classification is extensible without code changes.
14. As a content author, I want ship types to reference only a closed set of engine
    behaviour classes, so that no content string can select arbitrary executable
    behaviour.
15. As a content author, I want engineering dimensions to come only from structured fields,
    never from display names, so that a label like "35 cm" can never change compatibility.
16. As a content author, I want inherited data-quality issues to be carried with an
    enumerated, record-scoped waiver and reported, so that the zero-difference migration
    neither hides nor silently fixes them.

### Content agents

17. As an agent, I want to ask "what parts fit this slot at this month for this nation?",
    so that I can propose valid loadouts without trial and error.
18. As an agent, I want to ask "what was newly fittable in a given month?", so that I can
    answer historical availability questions from data.
19. As an agent, I want to ask for a part's lineage, so that I can explain succession and
    suggest modern replacements.
20. As an agent, I want to ask what a loadout costs, with each quantity component's basis and
    contribution, so that I can explain a design's cost and weight.
21. As an agent, I want the compiled output to record which part, revision and source file
    each fitted item came from, so that every number is traceable.
22. As an agent, I want the interface vocabulary to be small, stable and documented with
    one-line semantics, so that my edits are low-ambiguity and produce small diffs.

### Players and designers

23. As a ship designer, I want a hull to declare its mount positions with count limits,
    such as zero to three forward main mounts, so that the designer can offer meaningful
    choices.
24. As a ship designer, I want an over-full slot, a mismatched interface or a violated
    constraint to be a clear finding, so that I understand why a design is invalid.
25. As a ship designer, I want `mountCount` to always mean the number of installed units and
    `gunsPerMount` to always mean guns in one mount, so that the designer's numbers never
    change meaning by mount type.
26. As a ship designer, I want total guns to be derived from those two numbers, so that it
    can never disagree with them.
27. As a ship designer, I want parts that are not yet available, retired or superseded to be
    reported with the date or successor, so that I can fix the design quickly.
28. As a ship designer, I want refits to swap only parts that the same slot accepts and that
    pass its constraints, so that supersession alone never makes an incompatible refit
    legal.
29. As a ship designer, I want splitting or merging loadout entries to be shown as a change
    with a mass effect, so that I never mistake a semantic change for reformatting.
30. As a player, I want every existing reference design to keep exactly its current
    displacement, speed, armament, protection, cost, build time and findings through the
    migration, so that the campaign plays the same.
31. As a player, I want a save from an incompatible data-model version to be refused with a
    clear message and left untouched, so that I never load a half-translated campaign.
32. As a player, I want my workspace draft file from an older version to be left intact and
    not restored, so that nothing of mine is overwritten without being preserved first.
33. As a player, I want central-battery ironclads to be represented as batteries rather than
    as invented multi-gun turrets, so that the ships are not misrepresented.

### Combat

34. As the combat engine, I want to read torpedo performance only from compiled torpedo
    data through a narrow typed interface, so that no performance value is duplicated in
    combat code.
35. As the combat engine, I want launch, hit, interception, reliability, damage, flooding,
    salvo and AI-employment algorithms to stay in code, so that content cannot change
    behaviour except through data the algorithms read.
36. As the combat engine, I want armament to keep resolving to the same `ResolvedArmament`
    contract, so that the move to parts changes no combat result.

### Rendering

37. As the renderer, I want to choose drawings from explicit visual traits, with a
    part-specific override, a trait match, an interface-family fallback and a visibly
    marked missing-asset glyph, so that compatibility and appearance stay independent.
38. As the renderer, I want broadside and central batteries to use the existing
    casemate-family drawings through an explicit mapping, so that they never fall to the
    generic glyph.
39. As a maintainer, I want a test proving that changing only visual metadata leaves every
    simulation result unchanged, so that visuals can never leak into gameplay.

### Maintainers and the release process

40. As a maintainer, I want a committed, machine-readable equivalence report listing every
    compared metric for every design, including zeros, so that "nothing changed" is
    evidence, not a claim.
41. As a maintainer, I want the report to show, per loadout entry, `mountCount`,
    `gunsPerMount`, contained units, each quantity's value, basis and contribution, so that
    the mass-application rule is auditable.
42. As a maintainer, I want each of the nine central-battery entries to report legacy barrels,
    translated counts, total guns, original and translated fixed installation, mass, cost,
    crew, the legacy resolved mount type and the translation disposition, so that the
    reclassification is verifiable.
43. As a maintainer, I want the gate to enforce `legacy barrels = total guns` and
    `legacy fixed installation = translated PER_LOADOUT_ENTRY installation` for those nine,
    so that the reclassification cannot drift.
44. As a maintainer, I want `reclassified` to be a distinct status allowed only on the
    enumerated identity paths of those nine entries, never on numbers, always with old value,
    new value, design, placement and reason DQ-ARMAMENT-001, so that no other identity
    change can hide in it.
45. As a maintainer, I want inherited data-quality findings (DQ-TORPEDO-001,
    DQ-ARMAMENT-001) reported in their own section, so that they are never counted as
    differences and differences are never hidden as findings.
46. As a maintainer, I want the report to be byte-identical across runs and processes, so that
    it can be a deterministic gate.
47. As a maintainer, I want the coverage counts pinned (91 designs, 823 placements,
    230 guns, 28 tubes, 9 central batteries, 15 national launcher variants, 5 waivers), so
    that a content change that moves them fails until the fixture is deliberately updated.
48. As a maintainer, I want a campaign golden re-pin to be allowed only when every
    difference traces to an approved reclassification, with the report attached, so that
    goldens stay trustworthy.
49. As a maintainer, I want later deliberate changes (authored slots, basis changes,
    data-quality corrections) to require an approved-diff entry, so that intended changes
    are explicit and owner-approved.
50. As a maintainer, I want development fixtures to be migratable only by an offline,
    versioned developer tool, so that no translation path ships in save loading.
51. As a maintainer, I want the legacy formats (formula guns, national overrides, the
    armament adapter, `upgradePath`, combat torpedo constants) removed once nothing reads
    them, so that there is one representation.

## Implementation Decisions

Requirement IDs (`SPM-R*`) are referenced by the tickets that `to-tickets` will slice.

### Vocabulary and schema (`@bluewave/content-schema`)

- **SPM-R1 Part record.** A discriminated union on `family`: `gun`, `gun_mount`,
  `ammunition`, `torpedo_launcher`, `torpedo`, `propulsion_plant`, `armour_material`,
  `sensor`, `fitting`. The common envelope is id, family, provided interface, display name,
  optional nation, optional `extends`, lifecycle, optional parameters, family `spec`,
  quantity components, optional slots, optional revisions, optional enumerated legacy
  exceptions, optional visual block, and provenance. Decoding is strict
  (`onExcessProperty: "error"`). Fields are unit-suffixed.
- **SPM-R2 `interfaces/1`** (approved, closed, exact, case-sensitive): `gun`, `gun_mount`,
  `ammunition`, `torpedo`, `torpedo_launcher`, `propulsion_plant`, `armour_material`,
  `sensor`, `magazine`, `funnel`, `electrical_plant`, `accommodation`, `damage_control`,
  `ventilation`.
  - Calibre, diameter, side, station, arc, enclosure, date, nation, quantity and visual form
    are constraints or metadata, never interface identity.
  - There is no wildcard or catch-all.
  - Adding an interface needs a provider–consumer case; removal or redefinition is a
    breaking `interfaces/2`.
  - `armour_material` is accepted by armour-region slots, not mount points.
- **SPM-R3 Slot.** Accepted interfaces; `mountCount` bounds; placement (zone, or station
  range, side); nominal arc; closed constraints; `sameParts`; `mirrors`.
  - The constraint keys are closed: calibre min/max in whole inches, mount types, guns per
    mount, diameter min/max, diameter-equals-bore, launch types, maximum mass.
  - Platforms get slots through shared slot templates. A mount's `guns` slot count is its
    `gunsPerMount`.
- **SPM-R4 Lifecycle and revisions.**
  - The lifecycle is `availableFrom` (inclusive), `availableUntil` (exclusive, nullable),
    `requires` and `supersedes`.
  - A revision is a dated `spec` delta with its own provenance and optional `requires`.
  - Duplicate `from` on one part is an error.
- **SPM-R5 Application bases.** `PER_LOADOUT_ENTRY` | `PER_PART_UNIT` |
  `PER_CONTAINED_UNIT`, closed. Every quantity component (mass, cost, crew, volume, deck
  footprint) has a required basis. `PER_FIT` and `PER_MOUNT` are rejected (draft aliases
  only).
- **SPM-R6 Loadout entry.** Slot, part, `mountCount` (positive integer, default 1, the
  **only** quantity field), anchor station and side, optional per-unit placements,
  parameters, nested entries by child slot id, armour shape, `feedsFrom`. `barrels` does not
  exist in any schema.
- **SPM-R7 Legacy exceptions.** The closed code set is `DQ-TORPEDO-001`. Each exception
  waives exactly one named constraint (`diameterUmEqualsBore`) for one named counterpart
  part, and carries a note. These exceptions are accepted on migrated records only.
- **SPM-R8 Ship type record** (P3). Id; name; engine behaviour class from the closed,
  code-owned set (`capital_combatant`, `cruiser`, `torpedo_craft`, `colonial_vessel`,
  `merchant_auxiliary`, `aviation`, `submarine`); display category; roles; availability;
  classification parameters from a closed predicate vocabulary (displacement, speed,
  calibre, fit requirements, torpedo policy, hull trait); torpedo policy; relative cost
  and build time; AI weights; presentation; provenance.
- **SPM-R9 `visual-traits/1`** (P6; the definitions are in the proposal §8.2 and await the
  owner's review). Seven traits: `presentation_form`, `enclosure`, `barrel_arrangement`,
  `deck_relationship`, `orientation`, `size_class`, `elevation_style`. Each is either
  compiler-derived or derived with an authored override, with source fields, defaults,
  contradiction rules V1–V12, and the ADR-0148 translation map.

### Compilation (content compiler and the ship-design package)

- **SPM-R10 Flatten stage.** It resolves `extends` (depth ≤ 1, same family, no cycles), and
  rejects variants that change `provides`, `family`, a field's meaning or a quantity's kind
  or basis. It rejects supersession cycles and sorts revisions by `from`, then declaration
  order. It emits flattened parts into the content artifact. Codepoint ordering throughout.
- **SPM-R11 Part index.** Parts by id, interface and family; a lineage graph; flattened
  records with their sorted revisions; ship types. It is part of the artifact and its hash
  and lock.
- **SPM-R12 Fit validation**, a pure stage that completes before any derived calculation.
  The order is:
  1. slot exists;
  2. interface match **and** all constraints on the resolved spec;
  3. `mountCount` bounds, including nested entries;
  4. lifecycle at the design month;
  5. national access and hard limits (the stricter of national and platform wins);
  6. placement.

  Findings are structured and sorted: `FIT_COUNT_EXCEEDED`, `FIT_INTERFACE_MISMATCH`,
  `FIT_CONSTRAINT_VIOLATED`, `FIT_NOT_YET_AVAILABLE`, `FIT_UNAVAILABLE` (with
  `supersededBy`), `FIT_NATION_ACCESS`, and the ship-type `TYPE_REQUIRES_*`. Expected
  errors are findings; only invariant breaks throw.
- **SPM-R13 Basis-driven derivations.** Each component's contribution is its value × the
  basis multiplier:
  - `PER_LOADOUT_ENTRY` → 1;
  - `PER_PART_UNIT` → `mountCount`;
  - `PER_CONTAINED_UNIT` → `mountCount × gunsPerMount`.

  A nested entry's part units are its parent's contained units. The compiled output keeps
  the basis, multiplier and contribution per component. No calculation infers a basis
  from the family.
- **SPM-R14 Compiled entry.** It records the part id, the revision applied (or base), the
  source file, `mountCount`, `gunsPerMount`, contained units, compiled quantities, applied
  legacy exceptions and nested entries. The existing compile stages (arrangement, topside,
  arcs, magazines, fire control, weights, stability, cost, construction) consume resolved
  entries with their meaning unchanged.
- **SPM-R15 Queries:** `resolvePart`, `availableParts`, `partsForSlot`, `lineage`,
  `validateLoadout` and `loadoutCost`. All pure, deterministic and id-ordered.
- **SPM-R16 Armament contract.** Gun and mount parts feed the existing armament resolver
  shapes, so `ResolvedArmament` and the compiled weapon contract are byte-identical for
  every design except the nine D18 identity paths.
- **SPM-R17 Combat torpedo interface** (P4). A compiled torpedo record (part id, revision,
  diameter, warhead, mass, speed settings, range at speed, reliability, launch types) is the
  only torpedo data combat reads. The combat torpedo constants are removed.
- **SPM-R18 Refits.** Compatibility comes only from slot acceptance and constraints at the
  refit month. Refit kind rules move from allowed categories to allowed interfaces.
  `upgradePath` is removed.

### Migration (developer tooling only)

- **SPM-R19 P1 read path.** An adapter reads today's content and drafts into the new model
  in memory. P1 must not rewrite content, bump the save version, change saves or visual
  YAML, alter results, or normalise questionable data.
- **SPM-R20 Codemod (P2).** A deterministic one-shot rewrite with these translations:
  - **Placements:** one legacy placement → one loadout entry. Entries are never split or
    merged (S2–S4, I-19).
  - **Guns** (230 placements): single-gun types (CASEMATE, BROADSIDE_BATTERY,
    DECK_SHIELDED, DECK_OPEN) → `mountCount: barrels`, `gunsPerMount: 1`. TURRET or BARBETTE
    with 1–2 barrels → `mountCount: 1`, `gunsPerMount: barrels`. The legacy fixed
    installation → a `PER_LOADOUT_ENTRY` quantity; per-barrel terms → `PER_CONTAINED_UNIT`
    on the mount; gun mass → `PER_PART_UNIT` on the gun.
  - **The nine central-battery placements** (TURRET or BARBETTE with ≥ 3 barrels: two each
    on Redoutable, Kaiser and Sachsen; three on Mesudiye) → one battery assembly each:
    `mountCount: 1`, `gunsPerMount: barrels`, canonical mount type `BROADSIDE_BATTERY`, and
    installation masses and arc copied from the legacy resolved mount. The legacy resolved
    type and the disposition `RECLASSIFIED_AS_CENTRAL_BATTERY` go to migration provenance
    only. This carries DQ-ARMAMENT-001 in its narrowed wording.
  - **Torpedo tubes** (28 placements): `tubes: n` → `mountCount: n` of a single-tube
    launcher that keeps the legacy component id; an absent count → 1; invalid counts fail;
    launcher quantities are `PER_PART_UNIT` with no fixed term; no multi-tube launcher is
    inferred (T1–T6).
  - **National launcher variants** (15): prototypes of the base launcher. Each one's bore is
    its nation's structured `domesticTorpedoDiameterUm`. The five French, German and Russian
    variants carry DQ-TORPEDO-001 waivers. The Austro-Hungarian, Italian and Japanese
    "35 cm"/"350 mm" labels are display-only.
  - **Plants, armour materials (out of balance), ammunition, fittings, sensors** → parts.
  - **Hull forms** → platforms with **compatibility slot templates**: one slot per zone and
    interface accepting what is allowed today, so every design stays legal.
  - **Drafts' placements, machinery and armour regions** → loadout entries.
- **SPM-R21 Save compatibility (P2).**
  - The compatibility version goes from 1.2.0 to 2.0.0.
  - Compatibility is checked before campaign snapshots or workspace edit logs are
    deserialised. A mismatch is refused with the existing user-facing diagnostic naming
    the unsupported data-model version.
  - A rejected file is left byte-identical, and an incompatible workspace draft is
    preserved (renamed) before anything could overwrite it.
  - There is no runtime translation. An offline, versioned developer tool migrates
    development fixtures only, and is excluded from the desktop bundle.

### Equivalence (developer tooling and gates)

- **SPM-R22 Derived metrics.** A pure extraction of every derived result per design:
  - displacement and ledger;
  - hull and classification;
  - machinery, speed and range;
  - per-weapon armament and the full compiled weapon contract;
  - protection;
  - stability and systems;
  - cost and construction;
  - the findings multiset;
  - engine-facing outputs.
- **SPM-R23 Report** `ship-part-migration-equivalence/1`: baseline and candidate pipelines
  and content hashes; the tolerance manifest; pinned coverage counts; a summary by status;
  and per design, every metric (path, baseline, candidate, delta, tolerance, status).
  - **Per entry:** legacy placement, part, legacy barrels or tubes, `mountCount`,
    `gunsPerMount`, contained units, each quantity's value, basis, multiplier and
    contribution, totals (mass, cost, crew), launcher count and launcher mass for tubes,
    and, for the nine, the legacy resolved type and disposition.
  - **A separate `dataQuality` section.**
  - **Statuses:** `equal`, `withinTolerance`, `orderingOnly` (declared unordered paths with
    multiset equality only), `reclassified` (R1–R7 only), and `changed`.
- **SPM-R24 Gates.**
  - **Structural:** coverage matches exactly.
  - **Semantic:** `changed` = 0; every `reclassified` row is an enumerated D18 identity
    path with old value, new value, design, placement and reason DQ-ARMAMENT-001.
    `reclassified` is never on a number and never counted as equal, ordering-only or an
    approved numeric difference.
  - **The D17 equalities hold,** and torpedo `mountCount` equals legacy tubes.
  - **Determinism:** the report is byte-identical across runs and processes.
  - **Campaign goldens** are unchanged, or there is a recorded re-pin whose every difference
    traces to an approved reclassification, with the report attached.
- **SPM-R25 Approved diffs.** Later intended changes (authored slots, basis changes,
  data-quality corrections) must match an owner-approved entry, or the gate fails.

### Phasing

- **SPM-R26 Phase order and gates:**

  | Phase | Content | Gate |
  | --- | --- | --- |
  | P0 | Vocabularies and schemas; the ADR filed | — |
  | P1 | Read path, index, queries, harness, baseline report | Zero changes, full coverage |
  | P2 | Codemod, save bump, dev migrator | Zero changes except the approved reclassifications |
  | P3 | Ship types | Identical classification and goldens |
  | P4 | Torpedoes | Identical combat goldens and cross-process determinism |
  | P5 | Retire `ComponentDef` guns, `componentVariants`, profile gun-model overrides, the armament adapter, `upgradePath`, the combat torpedo constants | No reader left |
  | P6 | Visual-trait key rename, adapter, isolation test; then ship-visualization INC-4 | **Only after D16's exact definitions are accepted** |
  | P7 | Authored slots, basis changes, data-quality corrections | Approved diffs (out of scope here) |

## Testing Decisions

**What makes a good test here.** Tests observe external behaviour at the highest seam:

- a compiled artifact;
- a compiled design's derived metrics;
- a findings list;
- a refused save;
- a resolved drawing.

They never inspect internal stage functions. Expected values come from an independent
source of truth: today's legacy pipeline (the equivalence baseline), hand-worked examples,
or the proposal's tables. They are never recomputed the way the code computes them.

**Seams** (existing ones preferred; few new ones):

1. **Content compile seam (existing).** Decode and compile a content directory into an
   artifact. Tests here cover:
   - every closed vocabulary (unknown interface, constraint key, basis, legacy-exception
     code or trait value fails);
   - the prototype rules (depth, family, cycles, no interface or basis change);
   - revision ordering and duplicates;
   - supersession cycles;
   - provenance carried to compiled output.

   Prior art: the content-compiler decode and coverage suites, manifest authority, release
   gate and confidence tests.
2. **Design compile seam (existing).** Compile a design against an environment and read its
   derived metrics and findings. Tests here cover:
   - fit validation and its ordering before derivation;
   - every fit finding;
   - basis multipliers;
   - nested contained units;
   - the queries;
   - refit compatibility not implied by supersession.

   Prior art: the ship-design reference-design suites that compile every reference design,
   the armament content and compile tests, and the historical and opening starter tests.
3. **Equivalence harness (one new seam, at the highest point).** Run the legacy and new
   pipelines over all reference designs and produce the report. Tests and gates here cover:
   - coverage counts;
   - zero `changed`;
   - `reclassified` limited to R1–R7;
   - the D17 equalities and the torpedo counts;
   - the separate data-quality section;
   - byte-identical output across runs and processes;
   - a codemod property test on generated legacy drafts.

   Prior art: the golden-hash verifier, the golden re-pin guard, and the cross-process
   determinism runner.
4. **Save load seam (existing).** Load a campaign or workspace draft at a mismatched
   version: it is refused before decoding, the user-facing diagnostic appears, the file is
   unchanged, and an incompatible draft is preserved before any overwrite. Prior art: the
   continuity-command save-mismatch test (ADR-0113 §2).
5. **Combat seam (existing, P4).** A battle resolution reading compiled torpedo data gives
   identical golden results. Prior art: the combat golden and cross-process battle tests.
6. **Visual seam (existing, P6).**
   - Trait resolution and placement in `@bluewave/ship-visual`.
   - The non-interference test: a visual-only change leaves every derived metric and
     simulation hash identical.
   - V1–V12 failing the visual compile stage.
   - The translation map preserving every existing drawing.

   Prior art: the ship-visual golden resolution and placement matrices, and the catalog
   sync test.

The **test fixtures pin** the coverage numbers (91 designs, 823 placements, 230 gun, 28
tube, 9 central-battery placements, 15 national launcher variants, 5 waivers), the nine
D17 rows and the 28 torpedo rows from the proposal tables. A content change that moves them
fails until the fixture is deliberately updated.

**Validation per ticket** follows the repo bar:

- focused tests, typecheck, lint and format;
- the Effect lint gate for any Effect code, and the runtime-free gate for the pure packages;
- `pnpm check` before each phase closes;
- for P6, `pnpm snap` of the bottom-bar Shipbuilding workspace (screenshot, accessibility
  tree, clean console).

## Out of Scope

- **Authored mount-point slots per hull form** (for example real `fwd_main 0..3`), changing
  the legacy fixed-installation basis, and correcting DQ-TORPEDO-001 or DQ-ARMAMENT-001.
  These are P7 balance and content work, through approved diffs.
- **Translating player saves at load time,** or any runtime save migration path.
- **Deriving the `designs.yaml` fleet templates from loadouts** (deferred, D11).
- **Per-platform zone or armour-region vocabularies.** `ZONE_IDS` and `ARMOUR_REGIONS` stay
  (D9).
- **New interfaces, bases or trait values without a concrete use case,** including
  multi-tube launchers (`tubesPerLauncher`), `superimposed` arrangements and superfiring
  elevation.
- **Balance numbers, gameplay tuning, and new content authoring.**
- **The visual-trait vocabulary's final approval,** which is the owner's D16 review. Until
  then, P6 and ship-visualization INC-4 do not start.

## Further Notes

- **Corrected counts.** The coverage numbers come from a full decode of the reference
  designs and replace earlier figures (654 placements, 26 tube placements) that appeared in
  early proposal revisions.
- **Two identity strings are expected to change** in P2, for the nine central-battery
  entries only: the compiled weapon contract's `mountType` and `mountId`, and the engine
  design-version copy of `mountType`. Combat does not read gun mount type, and the
  rearmament rule reads the gun family's default mount type, so neither is affected. P1
  determines whether any of these nine designs feeds a campaign golden.
- **Shared-index commits.** Several sessions commit to `dev` from one checkout. Stage every
  ticket by explicit pathspec and verify the staged set before committing. P2 especially
  should be one single-purpose commit.
- **Glossary.** The proposal's terms go into `CONTEXT.md` with the first ticket: part, part
  family, interface, constraint, platform, slot, assembly, battery assembly, loadout entry,
  `mountCount`, `gunsPerMount`, contained units, application basis, lifecycle, revision,
  prototype, engine behaviour class, visual trait, data-quality finding, translation
  disposition.
