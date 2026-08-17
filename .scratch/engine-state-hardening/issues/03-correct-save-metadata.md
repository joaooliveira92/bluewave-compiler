# 03 — Correct SaveMetadata population

**What to build:** the fields in a save's metadata report their real values. Two
fields are mis-populated when a save is written: the "snapshot hash" field is
currently assigned the campaign id, and the "content artifact hash" field is
assigned the whole-campaign state hash. This ticket makes the metadata carry an
actual snapshot hash in the snapshot-hash field and the real content-pack
artifact hash in the content-artifact field, and adds tests asserting the new
semantics. Consumers (`list()`, campaign-continuity commands, save viewer /
enumerating the save directory) reconcile onto the corrected fields so nothing
depends on the wrong values.

**Blocked by:** None — can start immediately.

**Type:** implementation
**Status:** open
**Frontier:** yes

- [ ] Saving writes the actual snapshot hash into `snapshotHash` and the real content-artifact hash into `contentArtifactHash`.
- [ ] Tests assert each metadata field matches its documented meaning (and that a re-load of the same save yields the same values).
- [ ] `list()` and its consumers read the corrected fields; no consumer depends on the previously wrong values.
- [ ] The save-metadata shape stays backward-compatible for already-written saves (or documented migration/reconcile path).
- [ ] Full repo gate green: uncached build, `tsc -b`, lint, all per-package tests, goldens unchanged, two-process determinism byte-identical.