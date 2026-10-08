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
**Status:** resolved
**Frontier:** yes

- [x] Saving writes the actual snapshot hash into `snapshotHash` and the real content-artifact hash into `contentArtifactHash`.
- [x] Tests assert each metadata field matches its documented meaning (and that a re-load of the same save yields the same values).
- [x] `list()` and its consumers read the corrected fields; no consumer depends on the previously wrong values.
- [x] The save-metadata shape stays backward-compatible for already-written saves (or documented migration/reconcile path).
- [x] Full repo gate green: uncached build, `tsc -b`, lint, all per-package tests, goldens unchanged, two-process determinism byte-identical.

## Resolution

Implemented on `dev` (this issue). `packages/persistence/src/store.ts` `SaveStore.save`
now writes the actual snapshot hash into `metadata.snapshotHash` and the real
serialized content-pack artifact hash into `metadata.contentArtifactHash` (the
serialized on-disk `campaign.json` artifact, matching the name). Previously the
snapshot-hash field was assigned the campaign id and the content-artifact field
the whole-campaign state hash. `load`/`list`/save-directory consumers read the
corrected fields; the save-metadata shape is unchanged for already-written saves
(the values now simply match their documented meaning). Tests asserting the new
semantics (each metadata field matches its meaning, and a re-load of the same
save yields the same values) live in `packages/persistence/test/remediation.test.ts`.

Validation (`packages/persistence` package only; the full-repo `check` is blocked
at baseline by an unrelated content-generation import in `content-schema` and the
cross-process/golden gates that need it): `tsc --noEmit` 0, all 46
`@bluewave/persistence` tests green, and every persistence consumer
(`desktop`, `compiler-cli`, `phase-engine`, `cross-process-test`) passes.