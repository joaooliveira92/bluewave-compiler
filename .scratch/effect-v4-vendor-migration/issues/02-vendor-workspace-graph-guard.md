# 02 — Wire vendored packages into the workspace + single-copy guard

**Type:** implementation
**Status:** open
**Blocked by:** 01 (vendor artifacts)
**Frontier:** no

## What to build

Make the vendored copies the **only** resolvable `effect` in the pnpm graph:
register them as workspace members, force resolution via root overrides, and add
a hard single-copy guard wired into `pnpm preflight`. Internal consumers will
declare `"effect": "workspace:*"` (first real consumer lands in ticket 05; a
compile-only smoke may be used here to prove the wiring).

## Required reading (self-contained)

- `.scratch/effect-v4-vendor-migration/spec.md` — proves **MIG-VENDOR-4,
  MIG-GRAPH-1, MIG-GRAPH-2**; read "pnpm mechanics" and "Single-copy guard".
- `.scratch/effect-v4-vendor-migration/plan.md` §2.4–§2.5.
- `pnpm-workspace.yaml`, root `package.json`, `.npmrc`
  (`strict-peer-dependencies=true`, `auto-install-peers=true`),
  `scripts/preflight.cjs`.

## Acceptance criteria

- [ ] `pnpm-workspace.yaml` includes `vendor/effect` and `vendor/effect-vitest`
      (`MIG-VENDOR-4`).
- [ ] Root `pnpm.overrides` maps `effect` and `@effect/vitest` to the vendored
      workspace packages, so any transitive `@effect/*` request resolves to the
      vendored copy (`MIG-VENDOR-4`, `MIG-GRAPH-2`).
- [ ] `scripts/assert-single-effect.mjs` exits `0` when zero-or-one `effect`
      resolution exists, and exits non-zero when the lockfile/graph contains more
      than one resolution or any registry `effect` (`MIG-GRAPH-1`).
- [ ] A seeded duplicate-resolution fixture (guard self-test) makes the guard
      exit non-zero (`MIG-GRAPH-1`).
- [ ] The guard is invoked by `pnpm preflight` (hard gate); `pnpm preflight`
      green (`MIG-GRAPH-1`).
- [ ] `pnpm install --frozen-lockfile` is green; `pnpm why effect` reports no
      registry resolution (`MIG-GRAPH-2`).
- [ ] `pnpm check` remains green (no domain code changed).

## Notes

- At this point there may be no real consumer, so the guard must accept the
  zero-resolution case. The first real consumer (ticket 05) re-runs the guard.
- Do not add Effect imports to any package here; wiring only.
- Watch `strict-peer-dependencies`: confirm the vendored `package.json` version
  strings satisfy `@effect/vitest`'s `effect ^4.0.0` peer.
