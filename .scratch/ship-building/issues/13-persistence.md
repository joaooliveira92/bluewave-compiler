# 13: Schemas, migrations, .bwdesign.json, draft sidecar

**Type:** implementation
**Status:** resolved
**Blocked by:** none
**Frontier:** no

Spec: `.scratch/ship-building/spec.md` (see §26 row SB-13). Acceptance: the ACs named in the spec for this slice,
with unit, boundary, invalid-design, serialization and determinism tests per spec §22.

## Comments

- Landed: `.bwdesign` encode/decode (canonical, integer-only, schema version + forward migrations, content-drift detection), compiled-hash verification, undo/redo `EditLog` with compaction and persistence.
- Authoritative snapshot wiring (store compiled designs in the campaign snapshot, drafts in the UI-state sidecar) is SB-14.
