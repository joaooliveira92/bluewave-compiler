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
- **Orchestrator + 4 subagent roles, skill-driven + ticket-driven:** operate as an
  orchestrator (see `.ai/ORCHESTRATION.md`) that drives every sprint through the
  four focused subagents in `.opencode/agents/`, using four repo skills
  (`disable-model-invocation` ignored — invoke by name through the skill tool):
  1. **`wayfinder`** (chart) — huge/foggy efforts become a `map.md` + decision
     tickets on the `.scratch/` tracker, worked one decision ticket per session.
  2. **spec-creator** (read-only, uses **`to-spec`**) — turns the brief/
     conversation into `.scratch/<slug>/spec.md` (acceptance criteria→requirement
     IDs, user stories, decisions, tests, definition of done) with a
     `ready-for-agent` pointer; `.ai/specs/` is an index, not a store.
  3. **research** (read-only, uses **`research`**) — grounds content/data
     decisions in high-trust primary sources, writing `docs/research/` notes.
  4. **`to-tickets`** (slice) — breaks an approved spec into frontier-ordered
     **vertical implementation tickets** (`.scratch/<slug>/issues/`) with blocking
     edges.
  5. **implementator** (edit+run) — works the **frontier** (open, unblocked,
     `ready-for-agent`) ticket one at a time per `.ai/ENGINEERING-CONTRACT.md`,
     writes code + tests, runs focused validation, returns exact commands + results
     - changed-file list.
  6. **reviewer** (read-only) — adversarial pass per `.ai/REVIEW-PROMPT.md`
     against the ticket's acceptance criteria + spec + contract + repo standards,
     returning severity-tagged findings and an APPROVE / NEEDS_REWORK verdict.
     The orchestrator runs an **own validation gate before every commit** (clean
     uncached build, typecheck, lint, format, full tests, cross-process determinism,
     golden verification) and owns Git, traceability, and ADRs. Re-read files
     before editing; a subagent's report is a spec, not the source of truth.
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
