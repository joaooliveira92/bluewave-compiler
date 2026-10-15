# 09: Toolchain pin gate

**Type:** implementation
**Status:** open
**Blocked by:** None (can start immediately)
**Frontier:** yes

**What to build:** The `vite-plus` toolchain version and the Node version are
verified together as one pin, mirroring the existing Effect-toolchain integration
check, so a drifted local or CI runtime is caught by preflight rather than
surfacing as a mysterious build difference.

- [ ] A gate checks the `vite-plus` pin against the installed toolchain.
- [ ] It checks the Node pin (`engines` / `.node-version`) is coherent.
- [ ] A drifted pin fails closed with a named message; a fixture proves it.
- [ ] `pnpm preflight` stays green.
