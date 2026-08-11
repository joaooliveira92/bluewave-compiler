# CONTENT-SCHEMA — 09: Full-repo green

## Question

Verify typecheck, tests, and lint pass across `packages/content-schema` and
all dependents: content-compiler, campaign, commands, phase-engine,
apps/desktop, apps/compiler-cli, test-support, cross-process-test.

## Type

task

## Status

open

## Notes

- Acceptance for the whole map: repo green, research corpus typechecked,
  production pipeline green with re-locked hashes.
- Run `pnpm typecheck` / `pnpm test` / lint at the workspace root.

## Blocked by

01, 02, 03, 04, 05, 06, 07, 08.
