# INC-4 — Validation gate + traceability

**Type:** task
**Status:** resolved
**Blocked by:** INC-3

## What to build

- Orchestrator-owned gate: clean uncached build (`pnpm -w turbo run build --force`),
  `tsc -b`, format-clean on this slice, full test suite (serial), golden verify
  (`node scripts/verify-golden-hashes.cjs`), cross-process determinism
  (cross-process-test child + the diplomacy/research commit child twice).
- Confirm no `packages/phase-engine`/`packages/combat` changes; empty-command
  campaigns byte-identical.
- Write `.ai/reports/desktop-diplomacy-war.md` (exact commands + results);
  update `.scratch/desktop-diplomacy-war/map.md` (delivered; next candidate) +
  `.ai/specs/` pointer + `.ai/SPRINT-PLAN.md` + `docs/PROGRESS.md`.
- Small Conventional Commits on `dev`, clean working tree.

## Acceptance

- Full gate green (except documented pre-existing `nation.test.ts`); deferred
  candidates recorded; next pointer set.