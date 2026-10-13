# 12: Ship types as content (P3)

**Type:** implementation
**Status:** open
**Blocked by:** 11
**Frontier:** no
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
