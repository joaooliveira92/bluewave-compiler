# Toolchain

Bluewave's determinism guarantee (ADR-0007) only holds if local and CI run the same
toolchain. Pin it in one place and derive everything else from it.

## Pins

| Tool | Source of truth | CI |
| --- | --- | --- |
| Node | `.node-version` (`24.18.0`) | `actions/setup-node` `24.18.0` |
| pnpm | `package.json` `packageManager` (`pnpm@11.21.0`) | `pnpm/action-setup` `11.21.0` |
| TypeScript | root `devDependencies` (`7.0.2`) | from the lockfile |
| Test runner / linter / formatter | `vite-plus` (`1.1.0`, bundles vitest 5 / oxlint / oxfmt) | from the lockfile |

When bumping Node or pnpm, update `.node-version`, `packageManager`, and every
workflow in the same change; the determinism gate proves the result.

## Risk: bleeding-edge tooling

TypeScript 7 and vite-plus 1.1 are new major lines. Keep the lockfile committed and
`--frozen-lockfile` in CI (already), and treat a toolchain bump as its own change with
a full determinism run. Do not let a toolchain bump ride along with a feature.

## Effect-TS v4 migration

`.scratch/effect-v4-vendor-migration/` is in flight and vendors artifacts. A vendored
dependency is a supply-chain and maintenance liability: either **finish** the migration
so the vendor step is a build input with a verified hash, or **freeze** it at the last
released Effect v4 and drop the vendor tree. Do not leave it half-adopted.
