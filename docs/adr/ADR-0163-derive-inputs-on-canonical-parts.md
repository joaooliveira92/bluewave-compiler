# ADR-0163: The ship-part derive reads the canonical part representation — evaluated quantities and typed facts, never formulas

## Status

Accepted (2026-10-15). Stage 0 of the derive-first cutover required by
[ADR-0161](ADR-0161-derive-first-ship-part-cutover.md); supplements
[ADR-0154](ADR-0154-ship-part-model.md) (the part model) and
[ADR-0160](ADR-0160-designer-reads-the-parts-catalogue.md) (the designer's read),
supersedes neither. Work is tracked as ship-part-model ticket 17 and
[DEFERRALS](../DEFERRALS.md) D-12.

## Context

The production design compile is not parts-native. Every production `compileDesign`
reaches `resolveDesignComponents` (`packages/ship-design/src/compileStages.ts`), which
evaluates a legacy `ComponentDef`'s restricted-grammar **formulas** over its `constants`
and the placement's chosen `parameters`:

- `def.weightKg`, `volumeLitre`, `costMicro`, `crew`, `powerKw`, `coolingKw`,
  `deckFootprintMm2`, `heightMm`, `zCgMm` (one formula each);
- every `def.attributes.*` (`shellMassG`, `chargeBp`, `caliberUm`, `arcBlockedDeg`, …).

The parts barrier derives through that compile:
`compileDesignFromLoadout` → `rebuildDraft` → `compileDesignThroughFit` →
`compileDesign(draft, ctx)` (`compileProduction.ts`, `compileThroughFit.ts`). So
`ctx.catalogue: readonly ComponentDef[]` is still the derive's authority.

The compiled **part model** ([ADR-0154](ADR-0154-ship-part-model.md), ticket 11b) carries
no formulas. It carries:

- the five accounting quantities as an **affine decomposition** `fixed + perUnit × count`
  with an explicit application basis (`quantities`, SPM-R5);
- `engineering.physical` (height, centre of gravity), `engineering.power`
  (generation/consumption), `engineering.cooling` (demand/supply) and
  `engineering.maintenance`;
- `capabilities` (fire-control class and support, ammunition feed, arc obstruction,
  damage control);
- per-family scalar facts in `spec`, plus `lifecycle`, `parameters`, `entryUnits`,
  `metadata.tags` and `origin`.

A full inventory of the `ComponentDef` fields the derive reads against their part-model
destinations (confirmed against the tree at `1f34161b`) leaves exactly **six inputs with
no home**:

| Derive input | Part home | Evidence |
| --- | --- | --- |
| `allowedZones` | none | `partCatalogue.ts` destination `(none)`, rejected `PARTCAT_UNMAPPED_FIELD` |
| `forbidsCoLocation` | none | as above |
| `buildWorkMicro` | none | as above; read at `compile.ts` |
| `productionLine` | none | as above; read at `compile.ts` |
| `attributes.flammableBp` | none | not in the attribute sets; read at `compileStages.ts`; un-authored today (always `0`) |
| the legacy `ComponentCategory` token | none (family + `spec.weaponCategory` only) | the compile branches on category (`WEAPON_CATEGORIES`, `MAGAZINE`, `GENERATOR`, …) |

Every other derive input — including height, centre of gravity, electrical and cooling
load and the capability attributes — already has a typed destination. `constants` is not
carried because it exists only to feed formula evaluation, which this decision removes.

[ADR-0154](ADR-0154-ship-part-model.md) §15 makes a part **formula-free**: "A part has no
formulas, so the read path … translates a component's mass, cost, crew, volume and
deck-footprint formula only when it is affine in one declared count parameter." A formula
that is not affine, reads another parameter, or gives a negative or fractional term is a
coded read failure, never a guess. The P2 codemod (ticket 11) emitted the parts as
evaluated values and the equivalence gate proved **zero numeric difference** over all 91
reference designs, so the evaluated representation already reproduces the legacy derive's
numbers.

SPM-R5 fixes the three application bases (`PER_LOADOUT_ENTRY` | `PER_PART_UNIT` |
`PER_CONTAINED_UNIT`) but does not say where the derive's inputs live. ADR-0161 §3
requires that question to be closed by a recorded, accepted decision **before** any
runtime cutover. This is that decision.

## Decision

### 1. The derive consumes the canonical part representation; a part carries evaluated derive inputs, never formulas

The production derive is rewritten (Stage 1, ticket 17a-2) to read every per-placement
metric from the part itself:

- the five accounting quantities from `quantities`, each scaled by its SPM-R5 basis:
  `contribution = value × multiplier`, where the multiplier is `1` for
  `PER_LOADOUT_ENTRY`, `mountCount` for `PER_PART_UNIT`, and
  `mountCount × gunsPerMount` for `PER_CONTAINED_UNIT`;
- height and centre of gravity from `engineering.physical`; electrical load from
  `engineering.power.consumption` and generation from `engineering.power.generation`;
  cooling from `engineering.cooling`; upkeep from `engineering.maintenance`;
- fire-control class and support, ammunition feed, arc obstruction and damage control from
  `capabilities`;
- calibre, shell mass, propellant charge, round volume, rate of fire, beam arc and the
  other per-family scalars from `spec`;
- lifecycle, `requires`, `entryUnits`, parameter ranges and tags from the envelope.

A part states **evaluated values and their bases**. It carries no restricted-grammar
formula and no `constants` block, so the compiler performs no expression evaluation for a
part's quantities or attributes.

### 2. The six homeless derive inputs get explicit, typed homes in Stage 1

`allowedZones`, `forbidsCoLocation`, `buildWorkMicro`, `productionLine` and
`attributes.flammableBp` each gain a typed field (or a documented, typed projection) on the
part or its slot/entry, and the legacy `ComponentCategory` becomes a code-owned
family→category adapter. They are **not** re-expressed as formulas and never as a
free-form legacy bag (ADR-0154 §19). Until these homes exist, `partCatalogue.ts` rejects
them (`PARTCAT_UNMAPPED_FIELD`), which is why Stage 1 is a schema change as well as a
compiler change.

### 3. No `ComponentDef` is reconstructed

The derive builds a **parts-native resolved record**; the compile stages read its fields.
A `ComponentDef`-shaped projection is rejected ([ADR-0161](ADR-0161-derive-first-ship-part-cutover.md)
§2): it would present the legacy shape — and, if it carried formulas, the legacy strings —
as if the parts had authored them, a second content authority that could diverge silently.
The public `ComponentSummary` contract may keep its `category` field because it is fed by
the code-owned family→category adapter (§2), not by a synthesized catalogue.

### 4. Effect on SPM-R5

SPM-R5 is **unchanged**: the three bases and their multipliers are the closed vocabulary
and are now the derive's sole mass-application mechanism. No new basis is introduced,
`PER_FIT`/`PER_MOUNT` stay rejected, and a basis change remains an approved diff
(SPM-R25). This decision *depends on* SPM-R5; it does not amend it.

### 5. Nation filtering and the resolution key

`ctx.catalogue` is nation-filtered (`catalogueForNation` overlays national gun models and
variants and enforces the calibre ceiling) while the part model is nation-agnostic. Stage 1
therefore introduces a **nation-aware part view** built from the parts (a part's `nation`
and `lifecycle` as the filter; national models as `extends` variants), replacing
`catalogueForNation`. A placement resolves against that view by its part family or id (a
gun family id, a fitting or launcher id) rather than by a catalogue lookup. The exact
shape is Stage 1/3.

### 6. Migration and golden discipline

- The parts are already the codemod's output and P2 proved numeric equivalence, so the
  parts-native derive must reproduce the same derived metrics. A difference is a
  regression, not a re-pin.
- Stage 1 touches authoritative source (`packages/ship-design/src`,
  `packages/phase-engine/src`), so its commit carries a golden re-pin or a
  `Golden-Repin: not-needed` trailer (ADR-0136).
- Adding the §2 homes changes the compiled artifact when the codemod emits them, so the
  content lock and `contentArtifactHash`/`contentBundleHash` move deliberately and are
  re-pinned through the approved process (ADR-0145, SPM-R25). Later basis or authored-value
  changes remain SPM-R25 approved diffs.

## Consequences

- The derive no longer needs `Map<string, ComponentDef>`; the legacy production catalogue
  can retire in Stage 4, and the AC1 grep/no-reader gate becomes reachable.
- The part schema grows by the §2 homes; the content codemod that emits them must be
  re-run and the content lock re-pinned.
- Derived metrics become basis-driven and auditable per entry (SPM-R13/R14), which is the
  behaviour the equivalence report already records.
- `flammableBp` is read by the derive but un-authored today; Stage 1 either gives it a home
  or removes the read, deliberately.

## Alternatives considered

- **Carry the legacy formulas and `constants` on canonical parts (a `derive`/`formulas`
  block) so the compiler keeps evaluating expressions.** Rejected: ADR-0154 §15 makes a
  part formula-free; a formula home re-introduces the exact strings the migration exists to
  remove, is a second content authority, and lets a part and its consumer diverge silently.
- **Reconstruct a `ComponentDef` from the parts.** Rejected: forbidden by ADR-0161 §2; it
  is incomplete today and would be an impermissible compatibility wrapper.
- **Keep `ctx.catalogue` and only move the desktop commands.** Rejected: it is the status
  quo ADR-0161 exists to leave — the derive keeps needing the nation-filtered formula
  catalogue, Stage 4 can never retire it, and AC1 can never pass.
