# 13: Contract — delete the duplicated presentation tables

**Type:** implementation
**Status:** open
**Blocked by:** 11 — Migrate nation-selection consumers to DTOs; 12 — Migrate world-map consumers to DTOs
**Frontier:** no

**What to build:** Once no consumer reads the renderer-side presentation tables,
delete them and their audit tests, so there is exactly one source of truth and one
content edit drives every screen.

## Acceptance criteria

- [ ] The renderer-side presentation tables and their audit tests are removed.
- [ ] No renderer module imports a removed table; a search/architecture check
      proves it.
- [ ] The renderer bundle still contains no parser/validation runtime.
- [ ] Every affected screen is unchanged; `pnpm snap` green, console clean.
- [ ] A presentation change is a single content edit (no second table to update).
