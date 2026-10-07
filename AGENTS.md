## Agent workflow (governs every Bluewave sprint)

- **Branch:** all work lands on the `dev` branch. Do not develop on `main`;
  deliver via a PR from `dev` (or a short-lived feature branch) into `main` at a
  release boundary.
- **Session start:** sync the branch (`git pull --rebase` on `dev`) and run
  `pnpm preflight` before the first edit — red on an in-progress merge or conflict
  markers in tracked files (the 2026-10-06 `origin/dev` divergence cost a whole
  merge-resolution session; ADR-0044).
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
  2. **spec-creator** (writes the spec only, uses **`to-spec`**) — turns the
     brief/conversation into `.scratch/<slug>/spec.md` (acceptance criteria→requirement
     IDs, user stories, decisions, tests, definition of done) with a pointer in
     `.ai/specs/` (an index, not a store); never edits code.
  3. **research** (writes research notes only, uses **`research`**) — grounds
     content/data decisions in high-trust primary sources, writing
     `docs/research/` notes; never edits code.
  4. **`to-tickets`** (slice) — breaks an approved spec into frontier-ordered
     **vertical implementation tickets** (`.scratch/<slug>/issues/`) with blocking
     edges.
  5. **implementator** (edit+run) — works the **frontier** (open, unblocked,
     `Frontier: yes`) ticket one at a time per `.ai/ENGINEERING-CONTRACT.md`,
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

### Viewing the desktop UI

Agents can screenshot, inspect and click through the Electron app via Playwright. See
`docs/agents/desktop-view.md` (`pnpm snap` from the repo root). For any ticket that changes
what the player sees, the implementator and the reviewer each capture the affected screen with `snap`
and check it against the acceptance criteria (screenshot + `aria.yaml`, console clean, no churn
warning); a UI change without a captured screen is not APPROVE-able. `pnpm test:e2e` is part of
`pnpm check`.

### Issue tracker

Issues are tracked as local markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical triage roles, each label string equal to its name. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
