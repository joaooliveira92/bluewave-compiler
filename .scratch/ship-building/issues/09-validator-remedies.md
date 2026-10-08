# 09: Full validator, remedy generator, messages

**Type:** implementation
**Status:** resolved
**Blocked by:** none
**Frontier:** no

Spec: `.scratch/ship-building/spec.md` (see §26 row SB-09). Acceptance: the ACs named in the spec for this slice,
with unit, boundary, invalid-design, serialization and determinism tests per spec §22.

## Comments

- Landed: `compileDesign` orchestrator, tech/dock/treaty/modernization validators, `DraftEdit` + `previewEdit`/`improves` (remedy preview by recompile).
- Deferred: validation message templates stay in code for now (move to `content/messages/*.yaml` in SB-12); F-S4 list-on-flood; ranked automatic remedy generation (UI/AI use `previewEdit` directly).
- Note: critical-system concentration is measured by count of critical systems per zone, not mass (one engine room is not concentration).
