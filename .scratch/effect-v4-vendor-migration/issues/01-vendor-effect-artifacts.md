# 01 — Vendor `effect` and `@effect/vitest` (V1 published artifacts)

**Type:** implementation
**Status:** done
**Blocked by:** None (can start immediately)
**Frontier:** no

## What to build

Bring the exact published `effect` (stable 4.0.x) and `@effect/vitest` artifacts
into the repo under `vendor/` using **vendor model V1**, plus a sync/provenance
tool. Also vendor the Effect **source repository** as read-only reference
material for coding agents at `repos/effect` (Effect's own recommended
workflow). No in-repo source build of Effect. No consumer is wired yet (that is
ticket 02).

## Required reading (self-contained)

- `.scratch/effect-v4-vendor-migration/spec.md` — authoritative spec. This ticket
  proves **MIG-VENDOR-1, MIG-VENDOR-2, MIG-VENDOR-3, MIG-VENDOR-6, MIG-REF-1**;
  read the "Vendor specification (V1)" decision, the "Workspace wrapper
  (Turbo-safety)" bullet, and the "Read-only agent reference (`repos/effect`)"
  bullet.
- `.scratch/effect-v4-vendor-migration/plan.md` §2.1–§2.7.
- `docs/research/effect-v4-official-references.md` — Effect 4.0 stable + the
  official `git subtree` vendoring recipe.
- `docs/research/effect-v4-toolchain-compatibility.md` — why `skipLibCheck: true`
  stays (the `Channel.d.ts` / `TextDecoderOptions` wrinkle); v4 is ESM-only.

## Acceptance criteria

- [x] `vendor/effect/` contains `src/`, `dist/` (JS + `.d.ts`), `README.md`,
      `LICENSE` (verbatim), `UPSTREAM.package.json` (upstream `package.json`
      verbatim), `UPSTREAM.md`, and a thin wrapper `package.json` with identical
      `name` (`effect`), version, and `exports` map but **no `build`/`typecheck`/
      `lint`/`test` scripts** (`MIG-VENDOR-1`).
- [x] `vendor/effect-vitest/` mirrors the same V1 layout for `@effect/vitest`
      (`MIG-VENDOR-1`).
- [x] Pin is exact stable `effect@4.0.2` (or the exact stable `4.0.x` at
      execution time — **never an `rc`**); `@effect/vitest` pinned in lockstep.
      `UPSTREAM.md` records repo, git tag/commit, exact version, tarball
      integrity hash, sync date, and a patch list reading "none"
      (`MIG-VENDOR-2`, `MIG-VENDOR-6`).
- [x] `scripts/vendor-effect-sync.mjs` implements download → integrity verify →
      unpack → copy `src/`+`dist/` verbatim → re-apply `vendor/effect/patches/*`
      (none at adoption) → rewrite `UPSTREAM.md` → print `git diff --stat`
      (`MIG-VENDOR-3`).
- [x] Running the sync script twice at the pin produces an empty second
      `git diff --stat` (`MIG-VENDOR-3`).
- [x] No `vendor/effect/patches/*` files exist (`MIG-VENDOR-6`).
- [x] `repos/effect` is a read-only `git subtree` of the Effect source at the
      stable tag (`--squash`); it is not a pnpm workspace member, no application
      code imports from it, and `repos/**` is excluded from `vp lint`/`vp fmt`
      and editor search (add `AGENTS.md` "Vendored repositories" guidance)
      (`MIG-REF-1`).
- [x] `pnpm preflight` still green (no wiring changed yet).

## Comments

**DONE (committed `6fc7ed9d` + `repos/effect` subtree `2e8db356`/`d01a3736`);
accepted at the Wave 0 exit gate (ticket 04).** Orchestrator re-verification on
2026-10-11:

- `node scripts/vendor-effect-sync.mjs --verify` → effect@4.0.2 +
  @effect/vitest@4.0.2 match the published tarballs.
- `node scripts/vendor-effect-sync.mjs` re-run at the pin → empty
  `git diff --stat` (idempotent; sync date preserved).
- No `vendor/effect/patches/*`; wrapper `package.json` has no build/lint/test
  scripts (Turbo skips the vendored packages).
- `repos/effect` subtree present, excluded from `vp lint`/`vp fmt`
  (`vite.config.ts`) and editor search (`.vscode/settings.json`); `AGENTS.md`
  documents it.

## Notes

- **Prerequisite:** network access to fetch the exact npm tarball(s) and to run
  `git subtree add`. Verify the tarball with its npm integrity (`sha512-…`) and
  record it.
- Do **not** edit any `packages/*` or app code; do not add the vendor dirs to the
  workspace yet (ticket 02).
- Keep `LICENSE` and `README.md` byte-identical; only the wrapper `package.json`
  and `UPSTREAM.md` are Bluewave-authored.
- `repos/effect` is source-only reference (no build, no resolution); it must not
  enter the Turbo graph.
