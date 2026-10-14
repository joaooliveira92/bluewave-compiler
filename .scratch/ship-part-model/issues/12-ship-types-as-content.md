# 12: Ship types as content (P3)

**Type:** implementation
**Status:** claimed
**Blocked by:** 11
**Frontier:** yes
**Requirements:** SPM-R8, SPM-R11 (ship types in index), SPM-R12 (`TYPE_REQUIRES_*`), SPM-R26 (P3 gate) · Stories 13, 14

## What to build

Ship types move from code into content records: era availability, roles, doctrine tags,
classification parameters, torpedo policy, relative cost and build time, AI weights and
presentation. Each record names one **engine behaviour class** from the closed,
code-owned set. Classification algorithms stay in code and read only the closed
predicate vocabulary (displacement, speed, calibre, fit requirements, torpedo policy,
hull trait).

**Boundary:** this ticket runs in parallel with its sibling. It owns authored classification data and classification equivalence, and
it does not change torpedo part data or the `CompiledTorpedo` boundary (ticket 13), even if both are in flight at once.

## Acceptance criteria

- [ ] An unknown engine behaviour class or predicate fails decoding. No content string can
      select executable behaviour.
- [ ] Every reference design classifies identically, as shown by a P3 equivalence report
      with zero `changed`.
- [ ] `TYPE_REQUIRES_*` fit findings appear for a fixture design that violates a type's
      fit requirements.
- [ ] Campaign goldens are unchanged. Order-time availability (ADR-0088) behaves as before,
      checked against the existing ship-type e2e.

## Authorization (2026-10-14)

Owner authorized P3/P4. The spec's two "Proposed" items that gate this ticket —
the closed engine behaviour class set and the closed classification predicate
vocabulary — are resolved representation-preservingly (the P3 equivalence gate
requires **identical** classification, so the vocabulary encodes the existing
DESIGN-22 rules rather than changing them) and recorded in ADR-0156.

## Slicing (2026-10-14)

| Slice | Delivers | Acceptance criteria |
| --- | --- | --- |
| **12a** Schema, registry content and index | `ShipTypeRecordSchema` with a closed `engineClass` enum and a closed `classification` predicate vocabulary in `@bluewave/content-schema`; the 14 records authored at `content/production/1880/ship-building/ship-types.yaml` from today's code; declared in `pack.json`, carried through validate/flatten into the part artifact and `PartIndex.shipTypes`; strict-decode tests (unknown engine class / predicate key / category / role / era fails). Additive: classification still reads the existing code until 12b. | AC 1 (decode half) |
| **12b** Classification from content | Classification reads the compiled ship-type registry and its closed predicates; `TYPE_REQUIRES_*` fit findings; equivalence P3 report with zero `changed`; content lock refresh; ship-type e2e and campaign goldens unchanged. | AC 1–4 |
