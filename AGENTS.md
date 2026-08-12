## Agent workflow (governs every Bluewave sprint)

- **Branch:** all work lands on the `dev` branch. Do not develop on `main`;
  deliver via a PR from `dev` (or a short-lived feature branch) into `main` at a
  milestone or release boundary.
- **Continuous execution:** run sprints back-to-back from the backlog in
  dependency order, auto-advancing until a documented stop condition, a filed
  decision-request (already pending owner input), or the session budget is
  exhausted. Do not stop after a single sprint if an unblocked sprint remains.
- **Orchestrator + subagent workers:** operate as an orchestrator that spawns
  focused subagent workers (research, format extraction, YAML authoring,
  validation) and integrates their outputs, rather than accumulating one giant
  context. Re-read files before editing; a worker's report is a spec, not the
  source of truth.
- Deferred/mechanics-gated work is recorded as deferred, never silently dropped
  or fabricated.

## Agent skills

### Issue tracker

Issues are tracked as local markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical triage roles, each label string equal to its name. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
