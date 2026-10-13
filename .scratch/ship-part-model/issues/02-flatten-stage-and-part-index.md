# 02: Flatten stage and part index in the content artifact (P1)

**Type:** implementation
**Status:** resolved
**Blocked by:** 01
**Frontier:** no
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

- [x] Content-compile seam tests cover: depth-2 `extends`; a cross-family `extends`; an
      `extends` cycle; a variant that changes the interface, family or basis; a duplicate
      revision `from`; a supersession cycle. Each fails with a structured diagnostic.
- [x] A hand-worked fixture with a prototype, a variant and two revisions resolves to the
      expected flattened values at three months (before, between and after the revisions).
- [x] The artifact is byte-identical across runs and processes. The lock and hash cover
      the part index.
- [x] Cross-references fail with file and path: a platform naming an unknown slot template
      or hull form, and an unknown `extends`, `supersedes` or legacy-exception `forPart`.
- [x] Production content still compiles: with no part records yet, the index is empty and
      every existing golden is unchanged.

## Comments

- 2026-10-13: Implemented. A pure `flatten` compiler stage (between validate and normalize)
  checks cross-references and the prototype, revision and supersession rules, then emits
  `shipBuilding.partModel`: `partIndex` (`byId`, `byInterface`, `byFamily`, `lineage`), slot
  templates and platforms. Every flattened part carries `origin` (its source file and, for a
  variant, the prototype with the fields it inherited), with paths relative to the content
  root. `resolvePartRevision` (content-schema) resolves a part at a month. Rules are recorded
  in ADR-0154 §14.
- Deviation from the AC wording: with no part-model content the bundle carries no
  `partModel` key at all (instead of an empty index), so the production body hash and lock
  are unchanged (`576706c9…`). Consumers read an absent section as an empty index.
- Schema change: a variant's `spec` decodes as a delta (every field optional); a standalone
  part must still write every required spec field, reported at `spec.<field>`.
- Beyond the listed cross-references, unknown technology ids in `lifecycle.requires` and
  `revisions[].requires` are also `REF` errors. Part, slot-template and platform provenance
  is registered with the confidence report and the placeholder gate (ADR-0147).
- Deferred: ship types in the part index (SPM-R11) belong to ticket 12. `resolvePart`
  (ticket 07) should wrap `resolvePartRevision` rather than re-implement it.
- Review: the standards and spec reviews ran in parallel. Fixed: the stage no longer uses
  `node:path` (cwd-dependent); `PartModelSources` moved to the validate stage; a variant may
  not redefine `visual` (proposal §3.7, values only); no duplicate depth error for a part
  whose prototype is in a cycle; docstring and duplicated sort tidied. Not taken (judgement
  calls): an options object for the reporter, and a shared fixture between the compiler
  tests and the cross-process child (separate packages).

