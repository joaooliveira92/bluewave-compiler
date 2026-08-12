## Agent workflow (governs every Bluewave sprint)

- **Branch:** all work lands on the `dev` branch. Do not develop on `main`;
  deliver via a PR from `dev` (or a short-lived feature branch) into `main` at a
  release boundary.
- **Fully autonomous:** plan, research, implement, review, and validate every
  sprint end-to-end without a human in the loop. Do not pause to ask for
  direction or to surface medium/small tickets. Use your own judgement to resolve
  decisions (recording them as ADRs / decision records) unless they are a genuine
  canonical-contract ambiguity that would change authoritative gameplay; even then,
  prefer a documented, deterministic resolution (versioned ruleset constant +
  ADR) over stalling.
- **Continuous execution:** run sprints back-to-back from the backlog in
  dependency order, auto-advancing until the project is complete or the session
  budget is exhausted. Do not stop after a single sprint if an unblocked sprint
  remains.
- **Orchestrator + subagent workers:** operate as an orchestrator that spawns
  focused subagent workers (research, format extraction, YAML authoring, code
  authoring, validation) and integrates their outputs, rather than accumulating
  one giant context. Re-read files before editing; a worker's report is a spec,
  not the source of truth.
- **Human validation:** only at the very last step (final release delivery).
  Do not incrementally ask for milestone approval.
- Deferred/mechanics-gated work is recorded as deferred, never silently dropped
  or fabricated.

## Agent skills

### Issue tracker

Issues are tracked as local markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical triage roles, each label string equal to its name. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
