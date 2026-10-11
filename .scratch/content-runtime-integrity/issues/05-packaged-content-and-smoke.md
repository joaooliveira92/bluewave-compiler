# 05 — Packaged content resolution + fresh-game packaged smoke

**Type:** implementation
**Status:** open
**Blocked by:** 03
**Frontier:** no

## What to build

The compiled content artifact ships inside the packaged application and is
resolved relative to the app resources — not by walking up to the repository
root. Packaging configuration includes the artifact. The packaged smoke launches
the real binary, starts a **fresh** game (not merely opening a pre-compiled
save), and verifies the drawing board content loads and renders.

This closes a shipping landmine: today main resolves content by walking four
levels up to the repo root, which cannot exist inside a packaged app, and the
packaging config never includes the content tree.

## Acceptance criteria

- [ ] Packaged content resolution uses the app resources path and works from an
      installed / asar build with no repo-relative `../../../..` dependency.
- [ ] Packaging configuration ships the content artifact as a resource.
- [ ] `smoke:packaged` starts a fresh game and asserts the drawing board content
      loads (screenshot + clean console), not just a saved-game open.
- [ ] The packaged app runs correctly on a machine without the repository content
      tree present.

## Notes

- Grounds on the current content-pack resolver's explicit "packaged-app path
  resolution is out of scope" note and the release-verification gate ADR.
- The existing packaged smoke opens a compiled save; extend it to cover a fresh
  game, which is the path that actually reads shipped content at runtime.
- Depends on 03 (there must be an artifact for main to load and ship).