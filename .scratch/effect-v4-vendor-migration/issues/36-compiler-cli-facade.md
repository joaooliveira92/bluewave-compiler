# 36 — Compiler-CLI: `runPromise` entrypoint facade

**Type:** implementation
**Status:** open
**Blocked by:** 34 (facades unified)
**Frontier:** no

## What to build

Convert the `@bluewave/compiler-cli` entrypoint last: internals become
Effect-typed; the CLI boundary stays a plain-`Promise` entrypoint via a
`runPromise` facade so callers keep a normal CLI contract.

## Required reading (self-contained)

- `.scratch/effect-v4-vendor-migration/spec.md` — proves **MIG-WAVE5-EXIT**;
  Wave 5.
- `apps/compiler-cli/src/**`, `package.json` (bin `bwc`).
- `.scratch/effect-v4-vendor-migration/plan.md` §5.2.

## Acceptance criteria

- [ ] `compiler-cli` internals use Effect; the executable entrypoint is a
      `runPromise` facade with unchanged CLI behavior (flags, output, exit
      codes) (`MIG-WAVE5-EXIT`).
- [ ] Compiler output artifacts and diagnostics unchanged (any hash-surface
      change → ADR note).
- [ ] `pnpm --filter @bluewave/compiler-cli test` green; `pnpm typecheck` green.

## Notes

- Entrypoints are converted after the services they call (adoption-ticket-03
  order). Keep stdout/stderr/exit-code contract stable.
