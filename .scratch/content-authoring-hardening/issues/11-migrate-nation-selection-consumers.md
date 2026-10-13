# 11: Migrate nation-selection consumers to DTOs

**Type:** implementation
**Status:** open
**Blocked by:** 10 — Expand — presentation collection and IPC DTO path
**Frontier:** no

**What to build:** Move the nation-selection, globe and dossier consumers to read
presentation from the IPC DTOs instead of the local tables. The screens must look
and behave identically; the local tables remain in place but unused by these
consumers, so the batch stays green.

## Acceptance criteria

- [ ] Nation-selection/globe/dossier screens read coordinates, flavor, dossier and
      slot mapping from the IPC DTOs.
- [ ] Those screens render unchanged; `pnpm snap` shows no visible difference
      (aria stable, console clean).
- [ ] Renderer tests inject presentation DTOs rather than importing the tables.
- [ ] The old tables still exist for the remaining consumers (contract is a later
      ticket).
