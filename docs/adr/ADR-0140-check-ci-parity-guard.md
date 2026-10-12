# ADR-0140: Enforce every `pnpm check` step in CI, and the Effect toolchain at preflight

## Status

Accepted (2026-10-12).

## Context

`pnpm check` is the repository's definition of done: format, `lint`,
`lint:effect`, `test:scripts`, licences, typecheck, build, tests, golden,
determinism, and desktop E2E. CI is supposed to re-run it and remain the
authority (ADR-0107). In practice the two drifted: `pnpm check` grew `lint:effect`
(the type-aware `@effect/tsgo` Oxlint gate, ADR-0100/0101) but no
`.github/workflows/*.yml` ever ran it, so the Effect diagnostics — including
`duplicatePackage` as an error — were unenforced on `dev`/`main`. The local hooks
only ran `preflight`, so nothing caught the gap locally either.

Separately, ADR-0139 moved the `@effect/tsgo` patch into the root `prepare`
lifecycle, which means the toolchain is now patched by `pnpm install`. Nothing
verified that the versions the root `package.json` pins still match the matrix the
installed `@effect/tsgo` supports, or that the install-time patch actually ran.

## Decision

1. **Every `pnpm check` step is a CI step.** `quality.yml` gains a
   `pnpm lint:effect` run immediately after `pnpm lint`.
2. **Parity is machine-checked.** `scripts/verify-check-parity.mjs` parses the
   root `check` script into its ordered `pnpm <step>` commands and fails unless
   each is invoked by some `.github/workflows/*.yml` — matched as whole
   whitespace-separated tokens after a `pnpm` token, so a filtered
   `pnpm --filter @bluewave/desktop test:e2e` counts — or is listed in a small
   inline allowlist. The allowlist is seeded with exactly `check:golden` and
   `check:determinism`, whose CI coverage is a raw
   `node scripts/verify-golden-hashes.cjs` /
   `node packages/cross-process-test/dist/run-child.js` in `determinism.yml`.
   The gate joins the `preflight` set and `pnpm test:scripts`.
3. **The Effect toolchain is gated.** `scripts/verify-tsgo-integration.mjs`
   asserts the `@effect/tsgo`, `typescript`, `oxlint`, and `oxlint-tsgolint` pins
   in the root `package.json` match the matrix the installed `@effect/tsgo`
   supports (`0.51.1` → ts `7.0.2`, oxlint `1.87.0`, tsgolint `7.0.2003`), and
   that the install-time patch left an `.original` backup beside each patched
   native binary. It fails closed when `@effect/tsgo` is absent or its version is
   not in the matrix. It joins the `preflight` set and `pnpm test:scripts`.
4. **The Effect gate is a local push gate too.** `.githooks/pre-push` runs
   `pnpm lint:effect` after `preflight` (~2s), fail-fast.

## Consequences

- Adding a step to `pnpm check` without a CI invocation — or allowlisting it —
  now fails `preflight`, so the chain and CI cannot silently drift again.
- A toolchain version bump that outruns `TSGO_MATRIX`, or a `pnpm install` whose
  `prepare` patch did not run, fails `preflight` instead of degrading the Effect
  diagnostics quietly.
- The determinism pair remains raw-command steps in `determinism.yml`; the
  allowlist records that deviation rather than weakening the match.

## Related

- ADR-0100, ADR-0101 (Effect adoption and vendoring), ADR-0107 (verification
  hardening), ADR-0139 (install-time tsgo patch), ADR-0106 (decaying-quality
  gates), `oxlint.effect.json`.
