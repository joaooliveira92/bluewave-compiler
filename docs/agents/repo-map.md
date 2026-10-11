# Repository map

Where to start, folder by folder. Read [AGENTS.md](../../AGENTS.md) first; this
map is the tour.

| Path | What it is | Start at |
| --- | --- | --- |
| `apps/` | Platform entry points (`compiler-cli` CLI, Electron `desktop`). | [apps/README.md](../../apps/README.md) |
| `packages/` | 18 composable engine libraries; directed acyclic graph. | [packages/README.md](../../packages/README.md), ADR-0001 |
| `content/` | Authored 1880 scenario data, compiled into content packs. | [content/README.md](../../content/README.md) |
| `docs/` | Canonical design, ADRs, how-tos, research. | [README.md Document Map](../../README.md), [docs/adr/README.md](../adr/README.md) |
| `scripts/` | Gates and tools (no git hooks; run explicitly or via `pnpm check`). | [scripts/README.md](../../scripts/README.md) |
| `golden/` | Determinism golden data (`hashes.json`). | [golden repinning](golden-repinning.md) |
| `agent-patterns/` | Distilled idioms for writing code in this repo. | [agent-patterns/README.md](../../agent-patterns/README.md) |
| `.ai/` | Agent workflow: orchestration, engineering contract, briefs, reports, specs. | [ORCHESTRATION.md](../../.ai/ORCHESTRATION.md), [ENGINEERING-CONTRACT.md](../../.ai/ENGINEERING-CONTRACT.md) |
| `.agents/skills/` | Reusable skills (grilling, tdd, wayfinder, code-review, …). | `SKILL.md` in each skill |
| `.opencode/agents/` | Subagent definitions (spec-creator, research, implementator, reviewer). | the `.md` files |
| `.scratch/` | Local issue tracker (markdown tickets, specs, maps). | [issue tracker](issue-tracker.md) |
| `.github/workflows/` | CI gates (quality, determinism, desktop E2E, release). | the workflow files |
| `repos/`, `vendor/` | **Read-only** reference: Effect source subtree and vendored artifacts. | [AGENTS.md](../../AGENTS.md) "Vendored repositories" |
| `prototype/`, `codefetch/` | Throwaway experiments and code-context dumps; not shipped, excluded from tests. | — |
