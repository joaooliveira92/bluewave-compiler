# 08: CI on the Vite+ toolchain

**Type:** implementation
**Status:** open
**Blocked by:** None (can start immediately)
**Frontier:** yes

**What to build:** CI installs and runs on the same Vite+ toolchain as local:
workflows set up the toolchain with the Vite+ setup action pinned to an exact
release (not a moving tag), one job runs the full `pnpm check` verbatim, and the
task cache is restored. Local and CI then share one toolchain and cache, and the
"re-derived step list drifted from `check`" class is removed.

- [ ] Workflows set up the toolchain via the Vite+ setup action pinned to an
  exact release.
- [ ] One CI job runs `pnpm check` verbatim.
- [ ] The Vite Task cache is restored in CI.
- [ ] Existing required checks still pass.
