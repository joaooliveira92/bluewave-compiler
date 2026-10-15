# 01: Land the Effect runtime migration on `dev`

**What to build:** the full apps Effect migration (branch `feat/effect-apps-runtime`) is rebased onto
current `dev`, its conflicts resolved, the whole `pnpm check` is green on a clean checkout, and it is
reviewed and merged. After this, `dev` has one runtime-owning composition root in desktop main, a
program-only command registry, and Effect-native compiler-cli internals — and the follow-on hardening
work has a stable base.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] `feat/effect-apps-runtime` is rebased onto current `dev`; all conflicts are resolved without
      reintroducing a legacy handler path or a `*Deps` object.
- [ ] A clean checkout (fresh worktree, `pnpm install`) runs `pnpm check` to exit 0 with no reliance
      on a warm local cache.
- [ ] The renderer/preload bundle tripwire and the renderer boundary test stay green; goldens,
      cross-process determinism and equivalence stay byte-identical.
- [ ] The change is reviewed against ADR-0159 and the repo standards, then merged to `dev`.
- [ ] `dev` is left self-consistent (ADR index regenerates cleanly; no dangling ADR references).
