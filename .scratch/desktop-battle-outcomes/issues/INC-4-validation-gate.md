# INC-4: Orchestrator validation gate + traceability

Slug: desktop-battle-outcomes. Status: resolved. Blocked by: INC-3.

## Task

- Full orchestrator validation gate: clean uncached build
  (`pnpm -w turbo run build --force`), `pnpm -w exec tsc -b`, desktop + phase
  engine + campaign-engine suites, golden verify
  (`node scripts/verify-golden-hashes.cjs`) — 10/10 unchanged, two-process
  determinism (cross-process-test suite, 14/14 green), lint clean outside
  pre-existing unrelated failures.
- Confirm zero authoritative/engine/combat/phase-engine/content-pack changes
  and zero golden-hash changes.
- Write `.ai/reports/desktop-battle-outcomes.md` (validation-report template),
  update `docs/PROGRESS.md` (desktop gate queue: battle-outcome surfacing
  shipped), update `.ai/specs/desktop-battle-outcomes.md`, and record the
  sprint in `.ai/SPRINT-PLAN.md` traceability (desktop track note: B-6 battle
  outcome surfacing DONE).
- Create small Conventional Commits on `dev`; clean working tree.

## Validation

Exact gate commands + observed results recorded in the report with the commit
hash(es).

## Report

Command-by-command observed results; commit hash(es); whether push/PR occurred
(none — no remote-op), per the delivery contract.