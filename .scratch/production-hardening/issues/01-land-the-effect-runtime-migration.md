# 01: Land the Effect runtime migration on `dev`

**What to build:** the full apps Effect migration (branch `feat/effect-apps-runtime`) is rebased onto
current `dev`, its conflicts resolved, the whole `pnpm check` is green on a clean checkout, and it is
reviewed and merged. After this, `dev` has one runtime-owning composition root in desktop main, a
program-only command registry, and Effect-native compiler-cli internals — and the follow-on hardening
work has a stable base.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] `feat/effect-apps-runtime` is rebased onto current `dev`; all conflicts are resolved without
      reintroducing a legacy handler path or a `*Deps` object.
- [x] A clean checkout (fresh worktree, `pnpm install`) runs `pnpm check` to exit 0 with no reliance
      on a warm local cache.
- [x] The renderer/preload bundle tripwire and the renderer boundary test stay green; goldens,
      cross-process determinism and equivalence stay byte-identical.
- [x] The change is reviewed against ADR-0159 and the repo standards, then merged to `dev`.
- [x] `dev` is left self-consistent (ADR index regenerates cleanly; no dangling ADR references).

## Comments

The migration was already merged to `dev` at `a78019f5` (`Merge branch 'feat/effect-apps-runtime'
into dev`; `dev` == the feature tip). The landing was not yet validated: `pnpm check` failed for three
reasons unrelated to the Effect code, each now fixed so the gate is green on `dev`:

1. **lint** — `unicorn(no-useless-fallback-in-spread)` in `packages/ship-design/test/partCatalogue.test.ts`
   (ship-part-model 17a-2, `83b20cf2`); the redundant `?? {}` fallback on an object spread was removed.
2. **test** — `packages/content-codemod/test/codemod.test.ts` "rejects an unmapped one" went stale when
   17a-2 mapped `allowedZones` from `"(none)"` to a real destination; the test now uses the only
   remaining unmapped component field, `forbidsCoLocation`.
3. **check:golden-repin** — `1f34161b` (ship-part-model ticket 16, visual traits) changed authoritative
   source without a `Golden-Repin: not-needed` trailer; goldens/determinism/equivalence were verified
   unchanged, so the ratchet baseline was advanced past it via the documented procedure
   (`scripts/golden-repin.baseline`).

**Self-consistency:** ADR-0161 was claimed by two files (ship-part-model's derive-first cutover and
vp-task-consolidation's task-runner ADR); the index silently dropped the latter. The task-runner record
was renumbered to the next free number, **ADR-0164** (`docs/adr/ADR-0164-consolidate-on-the-vite-plus-task-runner.md`),
with `scripts/README.md` and the `scripts/adr-index.cjs` area map updated. `pnpm adr:index` now
regenerates cleanly with 0161 unique.

Final `pnpm check` on `dev`: exit 0 (preflight, format, lint, lint:effect, test:scripts, licences,
typecheck, build, content:verify, 2049 unit tests, heavy tier, golden 11/11, cross-process determinism,
equivalence, golden-repin, balance reports, 30 e2e).
