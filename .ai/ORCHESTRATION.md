# Bluewave Orchestration Pipeline

The orchestrator (the sprint/primary agent, launched by `.opencode/command/sprint.md`)
drives every sprint through four subagent roles plus an orchestrator-owned
validation gate. Subagents are defined in `.opencode/agents/`.

## Roles

| Role              | `.opencode/agents/` | Permissions         | Output                                                                                 |
| ----------------- | ------------------- | ------------------- | -------------------------------------------------------------------------------------- |
| 1. spec-creator   | `spec-creator.md`   | read-only           | `.ai/specs/<slug>.md` (criteria→req-ids, plan, symbols, tests, definition of done)     |
| 2. research       | `research.md`       | read-only           | `docs/research/<slug>-<topic>.md` (grounded data; used for content/spec-heavy sprints) |
| 3. implementator  | `implementator.md`  | edit+run            | code + tests + exact validation results + changed-file list                            |
| 4. reviewer       | `reviewer.md`       | read-only           | severity-tagged findings + APPROVE / NEEDS_REWORK verdict                              |
| orchestrator (me) | —                   | owns git/validation | full validation gate, git/traceability, ADRs, auto-advance                             |

Ordering: **spec-creator → research (when content/data is involved) →
implementator → reviewer → (repair loop) → orchestrator validation gate →
commit**.

## Handoff contract

- Each subagent's final report is a **spec for the next step, not the source of
  truth**. The orchestrator re-reads files before editing and independently
  verifies claimed results.
- The implementator works only from the spec; the reviewer checks only against
  the spec + contract + repo standards.
- On review verdict `NEEDS_REWORK` (blocker/high findings), the orchestrator
  sends the implementator back to repair, then re-reviews — never merging a
  failing review.

## Orchestrator-owned validation gate (mandatory, before any commit)

The orchestrator runs the full gate itself and records exact observed results in
the sprint's validation report (`.ai/reports/<slug>.md`):

- clean uncached build (`pnpm -w turbo run build --force`);
- `tsc -b`, `pnpm lint`, `pnpm format`;
- full test suite;
- determinism: cross-process child run twice (byte-identical) + golden verify
  (`node scripts/verify-golden-hashes.cjs`);
- any authoritative hash changes get old/new + cause + migration assessment
  (ADR-0007 process). A build alone is not acceptance (ENGINEERING-CONTRACT §Tests).

## Orchestrator responsibilities

- Pick the sprint from `.ai/SPRINT-PLAN.md`; optionally override with
  `$ARGUMENTS`; auto-advance per plan dependency order.
- Own all Git: small Conventional Commits on `dev`, no self-merge, clean tree.
- Update traceability (SPRINT-PLAN row done + pointer, PROGRESS.md, reports).
- Resolve routine decisions as ADRs; stop only on a genuine decision-request /
  stop condition.
- Keep the three/four roles tiny and focused so no single subagent accumulates
  the whole project context.
