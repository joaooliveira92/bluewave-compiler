# 02: Flatten stage and part index in the content artifact (P1)

**Type:** implementation
**Status:** open
**Blocked by:** 01
**Frontier:** yes
**Requirements:** SPM-R4, SPM-R10, SPM-R11, SPM-R14 (provenance) · Stories 3, 4, 5, 6, 21

## What to build

A content directory containing part records compiles into an artifact that carries
**flattened** parts and a **part index**. A national variant inherits its prototype, and
dated revisions resolve for a given month. Every flattened part records where its values
came from.

- Flatten `extends`: depth ≤ 1, same family, no cycles. Reject any variant that changes
  `provides`, `family`, a field's meaning, or a quantity's kind or basis.
- Sort revisions by `from`, then by declaration order. A duplicate `from` on one part is
  an error. Supersession cycles are errors.
- The part index holds parts by id, by interface and by family, plus a lineage graph and
  the flattened records with their sorted revisions. It is part of the artifact, its hash
  and its lock (ADR-0122/0123/0145). All ordering is by codepoint (ADR-0146).
- Provenance (source part, revision, file) is carried to the compiled output
  (ADR-0147).

## Acceptance criteria

- [ ] Content-compile seam tests cover: depth-2 `extends`; a cross-family `extends`; an
      `extends` cycle; a variant that changes the interface, family or basis; a duplicate
      revision `from`; a supersession cycle. Each fails with a structured diagnostic.
- [ ] A hand-worked fixture with a prototype, a variant and two revisions resolves to the
      expected flattened values at three months (before, between and after the revisions).
- [ ] The artifact is byte-identical across runs and processes. The lock and hash cover
      the part index.
- [ ] Cross-references fail with file and path: a platform naming an unknown slot template
      or hull form, and an unknown `extends`, `supersedes` or legacy-exception `forPart`.
- [ ] Production content still compiles: with no part records yet, the index is empty and
      every existing golden is unchanged.
