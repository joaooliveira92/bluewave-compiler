# 14: Submit/Start/Revise commands, template import

**Type:** implementation
**Status:** open
**Blocked by:** 10, 13
**Frontier:** no

Spec: `.scratch/ship-building/spec.md` (see §26 row SB-14). Acceptance: the ACs named in the spec for this slice,
with unit, boundary, invalid-design, serialization and determinism tests per spec §22.

## Comments

- Partial (landed): `toEngineDesign` adapter in `ship-design` projects a valid compiled design onto the engine's `CompiledDesignVersion` fields in ADR-0037 units (refuses invalid designs: I3).
- Remaining (not started): `SubmitDesign`/`StartConstruction`/revision commands in `packages/commands` + `packages/phase-engine`, snapshot storage, template import (needs SB-12 hull-form content), replacing `construction_order_v1`.
- Blocker (2026-10-08): `packages/campaign`, `commands`, `phase-engine`, `combat` carry another session's uncommitted edits; rebase/merge before touching them (AGENTS.md session-start rule).
