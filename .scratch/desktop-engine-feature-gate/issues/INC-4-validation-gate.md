# INC-4 — Gate: full validation + traceability

**Type:** task
**Status:** resolved
**Blocked by:** INC-3

## What to build

- Run the orchestrator-owned validation gate: clean uncached build
  (`pnpm -w turbo run build --force`), `tsc -b`, `pnpm format`, full test
  suite, golden verify (`node scripts/verify-golden-hashes.cjs`),
  cross-process determinism (child run twice, byte-identical).
- Confirm `BattleResolver`/`StrengthCalculator`/phase-engine unchanged (this
  slice touches only desktop + campaign-engine).
- Write `.ai/reports/desktop-engine-feature-gate.md` with exact commands +
  observed results; update `.scratch/desktop-engine-feature-gate/map.md` to
  mark frontier delivered and keep Diplomacy & War / battle-results rows as
  the recorded queue. Update `.ai/specs/` pointer for the sprint.
- Small Conventional Commits on `dev`, clean working tree.

## Acceptance

- Full gate green with observed evidence; deferred candidates recorded; next
  frontier pointer set (Diplomacy & War screen).