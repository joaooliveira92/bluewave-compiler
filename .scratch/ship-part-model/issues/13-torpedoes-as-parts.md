# 13: Torpedoes as parts and the compiled torpedo interface for combat (P4)

**Type:** implementation
**Status:** open
**Blocked by:** 11
**Frontier:** no
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
