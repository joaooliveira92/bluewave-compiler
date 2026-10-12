# Repository scripts

`scripts/` holds dependency-light Node scripts (`.mjs` / `.cjs`, plus one `.sh`)
that gate and generate repository artefacts.

## How they run

- **Git hooks** (`.githooks/`, installed from the `prepare` lifecycle →
  `core.hooksPath`): `pre-commit` and `pre-push` run `pnpm preflight`,
  `commit-msg` checks the subject. Bypass with `--no-verify`. Reinstall with
  `pnpm hooks:install`.
- **`pnpm preflight`** runs `scripts/run-gates.mjs`, a bounded, dependency-aware
  scheduler over the fast gates; also run by `pnpm dev` and CI.
- **`pnpm check`** adds format, lint, `lint:effect`, `test:scripts`, licences,
  typecheck, build, tests, balance reports, and desktop E2E.

## Gates (run by `preflight`)

| Script | Invoke | Purpose |
| --- | --- | --- |
| `run-gates.mjs` | `pnpm preflight` | Scheduler: bounded concurrency, `needs` edges, per-gate timeout (`BLUEWAVE_GATE_CONCURRENCY` / `_TIMEOUT_MS` / `_FAIL_FAST`). |
| `preflight.cjs` | (gate) | Fail fast on an in-progress merge/rebase or conflict markers. |
| `link-claude-skills.mjs` | (gate, `prepare`) | Recreate the `.claude/skills` → `.agents/skills` symlinks Claude Code discovers. |
| `assert-single-effect.mjs` | (gate) | `effect` single-copy invariant: `--self-test` (9 fixtures) then the lockfile. |
| `assert-runtime-free.mjs` | (gate) | Runtime-free import boundary (ADR-0100 §2, ADR-0128): `--self-test` (15 fixtures) then the pure packages + desktop main. |
| `verify-package-dependencies.mjs` | `pnpm check:dependencies` (gate) | Dependency policy: no floating specs, `effect` is `workspace:*`, internal deps use `workspace:`, toolchain pinned exact. |
| `docs-check.cjs` | (gate) | Markdown links + `#fragment` anchors, ADR index/status/supersession, deferrals ledger, DESIGN amendments. |
| `verify-doc-budgets.mjs` | `pnpm check:doc-budgets` (gate) | Enforce word ceilings in `scripts/doc-budgets.manifest.json` (`--list`). |
| `verify-no-unknown-casts.mjs` | `pnpm check:unknown-casts` (gate) | Ratchet against new `as unknown` casts. Fatal on new anywhere; stale entries fatal in CI, a warning locally (`--strict`, `--prune`, `--write`). |

## CI-only checks

| Script | Workflow | Purpose |
| --- | --- | --- |
| `check-commit-msgs.cjs` | `commit-convention.yml` (+ `commit-msg` hook) | Conventional-Commit subjects (range mode, or `--message-file`). |
| `verify-golden-hashes.cjs` | `determinism.yml` | Verify `golden/hashes.json`. |

## Tools (manual)

| Script | Invoke | Purpose |
| --- | --- | --- |
| `adr-index.cjs` | `pnpm adr:index` | Regenerate `docs/adr/README.md`; `docs-check` fails if it drifts. |
| `change-scope.mjs` | `pnpm change-scope --base <ref>` | Versioned change-scope JSON for CI filtering ([usage](../docs/agents/change-scope.md)). |
| `install-hooks.mjs` | `pnpm hooks:install` | Point `core.hooksPath` at `.githooks` (also runs from `prepare`). |
| `new-nation.mjs` | `node scripts/new-nation.mjs` | Scaffold a nation's content ([adding a nation](../docs/agents/adding-a-nation.md)). |
| `optimize-artwork.mjs` | `node scripts/optimize-artwork.mjs` | Regenerate downscaled AVIF card artwork from the JPG sources (macOS `sips`). |
| `vendor-effect-sync.mjs` | `node scripts/vendor-effect-sync.mjs [--verify]` | Regenerate/verify vendored Effect artifacts ([AGENTS.md](../AGENTS.md)). |
| `regenerate-golden-hashes.cjs` | manual | Re-bake `golden/hashes.json` ([golden repinning](../docs/agents/golden-repinning.md)). |
| `release-signing-wizard.sh` | manual | Guided release signing ([desktop signing](../docs/delivery/desktop-signing.md)). |

## Fixtures and support

`scripts/test/` (`pnpm test:scripts`, Node's built-in runner and glob) covers the
gates, including the scheduler's concurrency, `needs` skipping, and timeouts.
`doc-budgets.manifest.json` and `no-unknown-casts.baseline.json` are tracked
inputs; `lib/doc-anchors.cjs` is the anchor library behind `docs-check.cjs`.

Conventions for new scripts (ADR-0106/0107): fail closed, own your fixtures, and
wire the script into `preflight`/`check` or a workflow — never leave it
undocumented.
