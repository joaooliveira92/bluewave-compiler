# 13: Torpedoes as parts and the compiled torpedo interface for combat (P4)

**Type:** implementation
**Status:** open
**Blocked by:** 11
**Frontier:** yes
**Requirements:** SPM-R17, SPM-R26 (P4 gate) · Stories 5, 12, 34, 35

## What to build

Torpedoes become catalogue parts: dimensions, warhead, speed settings, range at speed,
reliability, cost and mass. The 1884 Whitehead warhead re-rating becomes a dated revision
with its own provenance. Launchers hold torpedoes through a nested slot. Combat reads a
compiled torpedo record through a narrow typed interface (part id, revision, diameter,
warhead, mass, speed settings, range at speed, reliability, launch types), and the combat
torpedo performance constants are removed. Launch, hit, interception, reliability,
damage, flooding, salvo and AI-employment algorithms stay in code.

**Boundary:** this ticket runs in parallel with its sibling. It owns torpedo part data and the typed `CompiledTorpedo` boundary, and
it does not change ship-type records or classification rules (ticket 12), even if both are in flight at once.

## Acceptance criteria

- [ ] No torpedo performance value remains in combat code. A test or grep gate proves it.
- [ ] Combat goldens are byte-identical, and cross-process battle determinism passes.
- [ ] A P4 equivalence report shows zero `changed`.
- [ ] Resolving the Whitehead torpedo before and after its 1884 revision gives the
      revised warhead, and its provenance points at the revision.

## Authorization (2026-10-14)

Owner authorized P3/P4. The spec's "Proposed" item that gates this ticket — the
`CompiledTorpedo` fields — is fixed by SPM-R17's enumerated field list and
recorded in ADR-0157 together with the torpedo-part spec fields.

## Slicing (2026-10-14)

| Slice | Delivers | Acceptance criteria |
| --- | --- | --- |
| **13a** Torpedo parts and `CompiledTorpedo` | `TorpedoSpecFields` completed to SPM-R17 (range at speed, launch types, warhead type/mass, mass, cost, reliability); `CompiledTorpedo` typed record; torpedo parts built from the catalogue and the codemod (`parts/torpedo.yaml`); launchers hold torpedoes through the nested `torpedo` slot; the 1884 Whitehead warhead re-rating as a dated revision with provenance; content lock refresh. Additive: combat still reads its constants until 13b. | AC 3–4 |
| **13b** Combat reads `CompiledTorpedo` | The narrow compiled-torpedo interface is the only torpedo data combat reads; per-model performance constants leave combat with a grep/no-reader gate; P4 equivalence report zero `changed`; combat goldens byte-identical and cross-process determinism pass. | AC 1–3 |
