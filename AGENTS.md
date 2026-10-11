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

### Repository map

Folder-by-folder entry points: `docs/agents/repo-map.md`. Each of `apps/`,
`packages/`, `content/`, `scripts/` and `agent-patterns/` also carries a
`README.md` that says what lives there and where the authoritative docs are.

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

### Renderer components

Screen UI lives under `apps/desktop/src/renderer/screens/<screen>/components/`.
Keep one component per file and re-export the directory's public surface from a
`components/index.ts` barrel (the shape the campaign-file, construction, diplomacy
and fleet screens already use). Presentational components take derived view-model
props and never read authoritative state. Where routing a child through the barrel
would close an import cycle (e.g. a panel that renders the rail, and the rail that
renders its leaves), import the leaf component directly.

### Vendored repositories

Two trees under the repo root are **read-only reference material**, not our code:

- `vendor/effect/`, `vendor/effect-vitest/` — the exact published `effect@4.0.2`
  and `@effect/vitest@4.0.2` artifacts (vendor model V1), the single-`effect`
  dependency for the whole workspace. Never edit `src/`, `dist/`, `LICENSE`, or
  `README.md` by hand: they are byte-identical to the npm tarballs and verified by
  `node scripts/vendor-effect-sync.mjs --verify`. The only authored files are the
  thin wrapper `package.json` and `UPSTREAM.md`; regenerate both with
  `node scripts/vendor-effect-sync.mjs` (never `pnpm add`/registry resolution).
- `repos/effect/` — a **read-only** `git subtree` of the Effect source repository
  at the `effect@4.0.2` tag, kept as reference for coding agents. Do **not** edit
  it and do **not** import from it (application code imports the `vendor/effect`
  workspace package). Read `repos/effect/LLMS.md` (and the relevant
  `repos/effect/packages/*` source) before writing Effect code; distilled idioms
  live in `agent-patterns/effect-*.md`.

`repos/**` and `vendor/**` are excluded from `vp lint`/`vp fmt`, from editor
search/auto-import, and from file watching (see `vite.config.ts` and
`.vscode/settings.json`). The vendored packages are registered in the pnpm
workspace and the graph is protected by a hard single-copy guard
(`scripts/assert-single-effect.mjs`, wired into `pnpm preflight`).

Effect code is additionally linted by the type-aware `@effect/tsgo` Oxlint gate
(`pnpm lint:effect`, config `oxlint.effect.json`; part of `pnpm check`). It
extends `@effect/tsgo/oxlint-presets/recommended.json`, runs `duplicatePackage`
as an error to reinforce the single-copy invariant, and surfaces the determinism
rules (`globalRandom`/`globalDate`/`cryptoRandomUUID`/`processEnv`/
`nodeBuiltinImport`) as warnings per the runtime-usage policy. `@effect/tsgo` is
a pinned **exact** devDependency **external** to `vendor/` — never vendor it; the
standalone `oxlint`/`oxlint-tsgolint` invoker is pinned exact to the versions
`vite-plus` resolves. See ADR-0100/ADR-0101 (adoption, vendoring).

Three `pnpm preflight` gates freeze qualities that would otherwise only decay
(ADR-0106): `scripts/verify-no-unknown-casts.mjs` ratchets `as unknown`
assertions out of the authored source against
`scripts/no-unknown-casts.baseline.json`, `scripts/verify-doc-budgets.mjs`
enforces word ceilings from `scripts/doc-budgets.manifest.json`, and
`docs-check.cjs` validates Markdown `#fragment` anchors. Their fixtures live in
`scripts/test/` (`pnpm test:scripts`, part of `pnpm check`). `scripts/change-scope.mjs`
(`pnpm change-scope`) prints a JSON change scope for change-based CI filtering
([usage](docs/agents/change-scope.md)).

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
