# 02 — Wire vendored packages into the workspace + single-copy guard

**Type:** implementation
**Status:** done
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

- [x] `pnpm-workspace.yaml` includes `vendor/effect` and `vendor/effect-vitest`
      (`MIG-VENDOR-4`).
- [x] Root `pnpm.overrides` maps `effect` and `@effect/vitest` to the vendored
      workspace packages, so any transitive `@effect/*` request resolves to the
      vendored copy (`MIG-VENDOR-4`, `MIG-GRAPH-2`). *(pnpm 11 reads this map from
      `pnpm-workspace.yaml` top-level `overrides:`, not `package.json#pnpm.overrides`.)*
- [x] `scripts/assert-single-effect.mjs` exits `0` when zero-or-one `effect`
      resolution exists, and exits non-zero when the lockfile/graph contains more
      than one resolution or any registry `effect` (`MIG-GRAPH-1`).
- [x] A seeded duplicate-resolution fixture (guard self-test) makes the guard
      exit non-zero (`MIG-GRAPH-1`).
- [x] The guard is invoked by `pnpm preflight` (hard gate); `pnpm preflight`
      green (`MIG-GRAPH-1`).
- [x] `pnpm install --frozen-lockfile` is green; `pnpm why effect` reports no
      registry resolution (`MIG-GRAPH-2`).
- [x] `pnpm check` remains green (no domain code changed).

## Notes

- At this point there may be no real consumer, so the guard must accept the
  zero-resolution case. The first real consumer (ticket 05) re-runs the guard.
- Do not add Effect imports to any package here; wiring only.
- Watch `strict-peer-dependencies`: confirm the vendored `package.json` version
  strings satisfy `@effect/vitest`'s `effect ^4.0.0` peer.

## Comments

Implemented on branch `dev` (not committed; orchestrator owns Git).

- **pnpm-11 overrides location (deviation from ticket text):** the override map
  lives in `pnpm-workspace.yaml` top-level `overrides:` (`effect: workspace:*`,
  `@effect/vitest: workspace:*`), not `package.json#pnpm.overrides`. pnpm 11
  rejected/moved the latter form; `pnpm install` resolved peers cleanly with
  `vendor/effect-vitest` linking `effect: link:../effect` under
  `strict-peer-dependencies=true` + `auto-install-peers=true`.
- **`test:run` hazard fixed:** root `test:run` now excludes the vendored members
  via `--filter='!./vendor/*'`; `pnpm -r` no longer invokes `vp test run` inside
  the test-less vendor packages. No global `--passWithNoTests` was added.
- **Guard:** `scripts/assert-single-effect.mjs` (pure `checkLockfile` + CLI +
  `--self-test` with 9 embedded fixtures) is wired into `pnpm preflight` in both
  modes (`--self-test` validates the checker itself, then the plain run gates the
  real lockfile). It fails closed if the lockfile is missing, empty, or
  unrecognized (no `lockfileVersion:` header / known section), and detects the
  legacy leading-slash registry key form.
- **Validation observed:** `node scripts/assert-single-effect.mjs` → exit 0;
  `--self-test` → exit 0 (9/9 fixtures); `pnpm install --frozen-lockfile` → exit
  0; `pnpm preflight`, `pnpm test:run` (241 files / 1554 tests), `pnpm typecheck`,
  `pnpm build`, `pnpm lint`, `pnpm format`, `pnpm check` (incl. 30 e2e) → all
  exit 0. Lockfile proof: no `packages:`/`snapshots:` key `effect@<version>`;
  the sole resolution is the workspace link `link:../effect`. (Note: on pnpm
  11.21.0 `pnpm why effect -r` prints nothing because `why` does not report
  `link:` dependencies, so the lockfile + guard are the authoritative proof, not
  `pnpm why`.)
- **Lockfile churn:** `pnpm install` also normalized an unrelated transitive
  (`@jridgewell/sourcemap-codec` 1.5.5→1.6.0 alongside the still-referenced
  1.5.5) and deduped a `vitest` peer suffix; both lockfile-only.
