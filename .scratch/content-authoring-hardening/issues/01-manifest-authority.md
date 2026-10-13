# 01: Manifest authority for the loaded surface

**Type:** implementation
**Status:** resolved
**Blocked by:** None (can start immediately)
**Frontier:** no

**What to build:** One manifest declares the whole loaded surface. Today the
manifest's `files` map declares the content-pack and campaign-file collections,
but the ship-building subtree is found by filesystem convention, and nothing fails
when the two disagree. Make the manifest the single declaration of what the
compiler loads, and fail closed when a discovered file is undeclared or a declared
file is missing. Reconcile the content README and the ship-building README.

## Acceptance criteria

- [ ] The manifest declares every loaded file, including the ship-building
      subtree (components, plants, hull forms, balance, armament, naval profiles,
      reference designs).
- [ ] `content:check`/`content:build` fail with an actionable diagnostic when a
      file discovered under a declared directory is not declared.
- [ ] `content:check`/`content:build` fail with an actionable diagnostic when a
      declared file does not exist.
- [ ] The production pack still compiles, with the same artifact body hash
      (declaration only, no content change).
- [ ] The content README and the ship-building README describe the one manifest
      and no longer claim the subtree is unloaded.

## Notes

- Prefer the single shared full-surface input builder over a second discovery
  path.
- A directory-style declaration is acceptable in place of listing each file, as
  long as there is one authority plus a fail-closed agreement check.
