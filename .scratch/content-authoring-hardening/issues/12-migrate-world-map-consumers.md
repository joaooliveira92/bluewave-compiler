# 12: Migrate world-map consumers to DTOs

**Type:** implementation
**Status:** open
**Blocked by:** 10 — Expand — presentation collection and IPC DTO path
**Frontier:** no

**What to build:** Move the area tree and campaign map to read the region grouping
and map-join data from the IPC DTOs instead of the local tables. A new area that
has no region cannot silently fall into a catch-all; the screens render unchanged.

## Acceptance criteria

- [ ] The area tree and campaign map read region/join data from the IPC DTOs.
- [ ] An area without a region fails a check (or is reported), not silently
      grouped.
- [ ] The screens render unchanged; `pnpm snap` shows no visible difference.
- [ ] The old tables still exist for any remaining consumer (contract is a later
      ticket).
