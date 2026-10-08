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

- 2026-10-08 SB-14 core landed (commits 1513c0f, 6243f17, ee25051 + this one): `SubmitDesign` command (ADR-0066): lifecycle shape validation, authoritative compile in `command_collection` with `ShipBuildingContent` passed via `MonthExecutorEngineOptions.shipBuilding`, desktop bridge `submitDesignCommand` (preflight compile, queued real envelope, `commitMonth` passes content), Drawing Board "Submit for construction", board locked to the campaign date and starting from the newest reference design valid then. Verified in the built app with `pnpm snap`: design 1880 torpedo cruiser -> Submit -> Advance month -> appears in Design Catalog (2,037 t, 17 kt).
- Still open: template import of authored designs, revision/refit commands, replacing `construction_order_v1` with `computeCost`/`planConstruction`, design study cost (DESIGN-21 section 3).
