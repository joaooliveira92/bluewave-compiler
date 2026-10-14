# ADR-0156: Ship types become content records naming a closed engine behaviour class

## Status

Accepted (2026-10-14). Filed with ship-part-model ticket 12 (P3). Implements
ADR-0154 §8 for ship types and closes the proposal's "Proposed" item "engine
behaviour classes and classification predicates".

## Context

The fourteen canonical ship types are the last of the seven ship-part sources
still defined in code (`packages/ship-design/src/shipTypes.ts`,
`shipTypeData.ts`). Their era availability, roles, doctrine-facing presentation,
torpedo policy, relative cost and build time are authored facts a content author
cannot extend without a code change, and the natural classifier's precedence is
the declaration order of a code array (`CLASSIFIED_SHIP_TYPES`).

Moving the *numeric* classification parameters out of code is already done: the
scenario authors `balance.yaml` → `ship.classification` (ADR-0116) and the code
owns the predicate functions that read those parameters. The P3 gate requires
**identical** classification and an unchanged findings multiset over all 91
reference designs (SPM-R26: "Identical classification and goldens"). The
predicate vocabulary therefore has to encode the existing DESIGN-22 rules rather
than change them.

## Decision

1. **Ship-type records become content.** A `ship-types.yaml` collection declares
   one record per canonical type: `id`, `name`, `engineClass`, `displayCategory`,
   `roles`, `era`, `availability`, `classification`, `torpedoPolicy`,
   `relativeCost`, `relativeBuildTime`, `auxiliary`, `requiredHullTrait`,
   `presentation`, `order` and `provenance`.

2. **Engine behaviour class is a closed, code-owned enum.** The seven values are
   `capital_combatant`, `cruiser`, `torpedo_craft`, `colonial_vessel`,
   `merchant_auxiliary`, `aviation`, `submarine` (proposal §3.5). An unknown class
   fails strict decoding; content cannot name an executable behaviour.

3. **The classification predicate vocabulary is closed and code-owned.** A
   record's `classification` block carries `precedence` (an integer ordering the
   natural classifier tries types in) and `requires` (an array of fit-requirement
   predicates — slot, interface, closed constraint keys, `mountCountMin`) in the
   closed vocabulary of proposal §3.5. Unknown predicate keys, constraint keys,
   interfaces, categories, roles, era bands or torpedo policies fail decoding.
   The numeric thresholds stay in the code-owned `ClassificationRules` and the
   scenario's authored `balance.classification`, so the classification algorithm
   and its findings are provably unchanged. `precedence` must reproduce the
   existing `CLASSIFIED_SHIP_TYPES` order exactly, pinned by a regression test.

4. **`requires` drives `TYPE_REQUIRES_*` fit findings** (SPM-R12): a design that
   violates a type's declared fit requirement yields a `TYPE_REQUIRES_*` finding
   and no derived metrics beyond the fit barrier.

5. **Evidence.** Slice 12a (schema, records, index) refreshes the content lock
   under ADR-0145 and adds a regression pinning the authored records equal to the
   code registry. Slice 12b flips the classifier to the compiled registry and
   produces the P3 equivalence report over the 91 reference designs (zero
   `changed`), keeps campaign goldens unchanged, and keeps the ship-type e2e
   (ADR-0088 order-time availability) green.

## Consequences

- Content authors can add a type, change its presentation, roles, availability or
  torpedo policy, and reorder the natural classifier without a code change.
- Inline per-type numeric thresholds (the proposal §3.5 illustrative form) are
  deliberately **not** adopted in P3: moving them would risk changing
  classification outcomes, which the P3 gate forbids. Per-type threshold authoring
  is a P7 approved-diff concern (SPM-R25).
- The code keeps the classification algorithm and the predicate functions; the
  record references them through closed identifiers and closed predicate data.
- **AI weights** (SPM-R8) are not carried on the ship-type record: they are already
  content, authored per archetype in `balance.ai`, and are not per-type data. The
  record's `presentation`, `roles`, `torpedoPolicy`, cost and build-time ordinals are
  the type-level facts the code registry held.

## Alternatives

- **Keep ship types in code.** Rejected: ADR-0154 §8 and ticket 12 require them
  in content.
- **Inline numeric thresholds per type.** Rejected for P3: the equivalence gate
  requires identical classification; authoring fresh thresholds cannot be shown
  equivalent without re-deriving every boundary.
