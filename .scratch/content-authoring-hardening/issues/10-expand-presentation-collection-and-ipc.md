# 10: Expand — presentation collection and IPC DTO path

**Type:** implementation
**Status:** open
**Blocked by:** 01 — Manifest authority for the loaded surface; 07 — Decode the verified bundle at the artifact boundary
**Frontier:** no

**What to build:** Add the presentation corpus as authored pack content and serve
it over the existing narrow content IPC, without removing the renderer's current
tables. Nation coordinates, flavor text, dossier fields and the
nation-id→country-id slot mapping become a compiled collection; the area→region
grouping and the campaign-map join become authored content (or are derived from
it). Main serves the decoded presentation DTOs over the existing content
capability. Nothing consumes the DTOs yet, so no screen changes.

## Acceptance criteria

- [ ] The presentation collections are declared in the manifest and compiled into
      the artifact.
- [ ] Main serves presentation DTOs over the existing content IPC; no filesystem,
      path or generic-read capability is exposed.
- [ ] The renderer bundle gains no parser or validation runtime.
- [ ] The existing renderer tables still drive the screens (nothing breaks);
      `pnpm snap` is unchanged.
- [ ] A source/boundary test proves the served DTOs are the authored content.
