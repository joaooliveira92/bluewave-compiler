# Repository scripts

`scripts/` holds dependency-light Node scripts (`.mjs` / `.cjs`, plus one `.sh`)
that gate and generate repository artefacts. **There are no local git hooks**
(`core.hooksPath` is unset), so nothing runs on commit — a script runs when you
invoke it, when a wrapper command calls it, or in CI (`.github/workflows/`).

- **`pnpm preflight`** — the fail-fast gate set; also run by `pnpm dev`,
  `pnpm check`, and the CI `quality.yml` job.
- **`pnpm check`** — preflight plus format, lint, `lint:effect`, `test:scripts`,
  licenses, typecheck, build, tests, balance reports, and desktop E2E.

## Gates (run automatically)

| Script | Invoke | Purpose |
| --- | --- | --- |
| `preflight.cjs` | `pnpm preflight` | Fail fast on an in-progress merge/rebase or conflict markers in tracked files. |
| `assert-single-effect.mjs` | via preflight | Fail if the `effect` single-copy invariant breaks (`--self-test` runs 9 fixtures). |
| `docs-check.cjs` | via preflight | Markdown link + `#fragment` anchors, ADR index/status/supersession, deferrals ledger, DESIGN amendments. |
| `verify-doc-budgets.mjs` | via preflight | Enforce word ceilings in `scripts/doc-budgets.manifest.json` (`--list` to inspect). |
| `verify-no-unknown-casts.mjs` | via preflight | Ratchet: reject new `as unknown` casts not in `scripts/no-unknown-casts.baseline.json` (`--prune`, `--write`). |
| `license-check.cjs` | `pnpm check:licenses` | Dependency licence compliance. |
| `check-balance-reports.cjs` | `pnpm check:balance-reports` | Regenerate balance reports and fail on drift. |
| `test/` | `pnpm test:scripts` | Fixtures for the gates above (Node's built-in runner). |

## CI-only checks

| Script | Workflow | Purpose |
| --- | --- | --- |
| `check-commit-msgs.cjs` | `commit-convention.yml` | Validate Conventional-Commit subjects in the push/PR range. |
| `verify-golden-hashes.cjs` | `determinism.yml` | Verify `golden/hashes.json`. |

## Tools (manual)

| Script | Invoke | Purpose |
| --- | --- | --- |
| `adr-index.cjs` | `pnpm adr:index` | Regenerate `docs/adr/README.md` from the ADR files. `docs-check` fails if it drifts, and errors tell you to run this. |
| `change-scope.mjs` | `pnpm change-scope --base <ref>` | Versioned JSON change scope for CI filtering ([usage](../docs/agents/change-scope.md)). |
| `new-nation.mjs` | `node scripts/new-nation.mjs` | Scaffold a new nation's content ([adding a nation](../docs/agents/adding-a-nation.md)). |
| `vendor-effect-sync.mjs` | `node scripts/vendor-effect-sync.mjs [--verify]` | Regenerate/verify the vendored Effect artifacts (see [AGENTS.md](../AGENTS.md) "Vendored repositories"). |
| `regenerate-golden-hashes.cjs` | manual | Re-bake `golden/hashes.json` ([golden repinning](../docs/agents/golden-repinning.md)). |
| `release-signing-wizard.sh` | manual | Guided macOS/Windows release signing ([desktop signing](../docs/delivery/desktop-signing.md)). |

## Support files

`doc-budgets.manifest.json` and `no-unknown-casts.baseline.json` are the gates'
tracked inputs; `lib/doc-anchors.cjs` is the Markdown anchor library consumed by
`docs-check.cjs`.

Conventions for new scripts live in [AGENTS.md](../AGENTS.md) (ADR-0106): a gate
must fail closed, own its fixtures, and be wired into `preflight`/`check` or a
workflow — never left undocumented.
