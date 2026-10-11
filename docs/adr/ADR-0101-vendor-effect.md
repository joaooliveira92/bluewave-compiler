# ADR-0101: Vendor Effect

## Status

Accepted (2026-10-11).

## Context

ADR-0100 pins an exact stable Effect v4. Resolving `effect` from the npm registry
still leaves the artifact mutable, un-auditable, and capable of silently mixing a
registry copy with a locally patched one. Effect uses `Context`/`Layer`/service
identity at runtime, so **two copies of `effect` in the graph cause silent
failures** (service not found, `instanceof` mismatches). The project needs a
frozen, byte-reproducible, patchable copy and a hard guarantee there is exactly
one.

Effect's own guidance also recommends vendoring the Effect **source repository**
as read-only reference so coding agents can read real usage patterns.

## Decision

1. **Vendor model V1 — vendor the published artifact.** `vendor/effect/` and
   `vendor/effect-vitest/` hold the tarball contents byte-for-byte: `src/`,
   `dist/`, `README.md`, `LICENSE`, plus the upstream `package.json` retained as
   `UPSTREAM.package.json`. There is **no in-repo source build** in the default
   path.
2. **Workspace wrapper (Turbo-safety).** Each vendored package carries a thin
   Bluewave-authored `package.json` with identical `name`, identical version
   string, and identical `exports`, but **no `build`/`typecheck`/`lint`/`test`
   scripts**, so Turbo treats it as a leaf and does not try to build Effect from
   source with absent upstream devDependencies. `UPSTREAM.md` records the
   upstream repo, tag/commit, exact npm version, tarball integrity hash, sync
   date, and patch list.
3. **Zero-patch default.** Adoption starts with no patches. The known
   library-level wrinkle (`Channel.d.ts` referencing the DOM global
   `TextDecoderOptions`) is absorbed by the repo's `skipLibCheck: true`. A future
   patch is explicit, recorded in `UPSTREAM.md`, and re-applied by the sync
   script.
4. **Sync procedure.** `scripts/vendor-effect-sync.mjs` (`--version <exact>` or
   `--tag <git-tag>`) downloads, integrity-verifies, unpacks, copies
   `src/`+`dist/` verbatim, re-applies any `vendor/effect/patches/*.patch`,
   rewrites `UPSTREAM.md`, and prints `git diff --stat`. A no-op run at the pin is
   an empty diff. `--verify` re-checks the recorded integrity hash.
5. **Single-copy invariant.** Consumers declare `"effect": "workspace:*"` (and
   `"@effect/vitest": "workspace:*"` in dev); the root `overrides` map in
   `pnpm-workspace.yaml` maps `effect`/`@effect/vitest` to the workspace copies.
   `scripts/assert-single-effect.mjs` is a **hard `pnpm preflight` gate** that
   fails on more than one resolution or any registry `effect`. The
   `@effect/tsgo` **`duplicatePackage`** diagnostic reinforces the same invariant
   from the type-aware lint program.
6. **Read-only agent reference (`repos/effect`).** The Effect source repository is
   vendored via `git subtree` at the stable tag, **read-only**: it is not a pnpm
   workspace member, is never imported by application code, and is excluded from
   `vp lint`/`vp fmt`, editor search/auto-import, and file watchers. `AGENTS.md`
   documents the rule; agents read `repos/effect/LLMS.md` before writing Effect
   code; distilled idioms live in `agent-patterns/effect-*.md`.
7. **Toolchain (`@effect/tsgo`, external).** `@effect/tsgo` is a pinned **exact**
   devDependency **outside `vendor/`** (LSP tooling, not a shipped runtime). It
   powers the Effect type-aware Oxlint gate via the official patch
   (`effect-tsgo patch --no-typescript --oxlint`) and a dedicated
   `pnpm lint:effect` task (`oxlint.effect.json` extends
   `@effect/tsgo/oxlint-presets/recommended.json`, enables `duplicatePackage` as
   an error and the determinism rules as warnings, and runs type-aware via the
   `effecttsgo` plugin). `oxlint`/`oxlint-tsgolint` are pinned exact to the
   versions `vite-plus` already resolves (`1.87.0` / `7.0.2003`) so the
   standalone invoker never conflicts with `vp lint`. The
   `@effect/language-service` plugin is configured `diagnostics: false` so the
   LSP and Oxlint never double-report.
8. **tsconfig policy.** `skipLibCheck: true` is retained — it is load-bearing for
   Effect (`Channel.d.ts` DOM globals) and is the sole reason the zero-patch
   default holds. **`erasableSyntaxOnly` is not enabled** for consumer code: the
   tree still uses `enum`, `namespace`, and constructor parameter properties
   (`packages/combat`, `packages/contracts`, `packages/random`,
   `packages/phase-engine`), and enabling it would force domain rewrites outside
   Wave 0. It remains an optional future hardening, not a requirement of the
   migration.

## Consequences

- Installs are reproducible and offline-capable; the exact Effect artifact is
  auditable in-tree and patchable without waiting upstream.
- A broken dependency graph (a second `effect`) fails `pnpm preflight` before any
  build, with `duplicatePackage` as a second, type-aware signal.
- `pnpm lint:effect` requires a reproducible post-install patch step; it is
  invoked by the task itself, so a fresh clone needs no extra ceremony.
- `erasableSyntaxOnly` stays off, so native type-stripping hardening is
  deliberately not claimed by this migration.

## Alternatives considered

- **Vendor model V2 (vendor source, build in-repo with tsgo).** Rejected as the
  default: reproducing Effect's multi-entrypoint packaging risks drift from the
  published artifact. Kept as a documented fallback only if a patch ever forces a
  source build.
- **No vendoring; registry pin only.** Rejected: no freeze, no integrity pin, no
  in-tree patchability, and no agent-legible source.
- **Bundle Effect's upstream `package.json` unchanged.** Rejected: a pnpm
  workspace member is a Turbo task target and Turbo would run Effect's upstream
  `build`.
- **Run the Effect rules through `vp lint`.** Rejected: `vp lint`'s config does
  not register the native `effecttsgo` plugin and does not accept an Oxlint
  config file, so the Effect rules cannot be hosted there without weakening it;
  a dedicated `lint:effect` script pins the invoker without touching `vp lint`.
- **Enable `erasableSyntaxOnly` now.** Rejected: it breaks existing consumer
  syntax and would expand Wave 0 into domain rewrites.

## Related

- `repos/effect/LLMS.md`, `agent-patterns/effect-idioms.md` — agent reference.
- `scripts/vendor-effect-sync.mjs`, `scripts/assert-single-effect.mjs`,
  `oxlint.effect.json` — the enforced machinery.
