# CI gates and branch protection

Everything that must be green before a commit is trusted. The workflows live in
`.github/workflows/`; this note records what each one protects and the repository
settings that must enforce them.

## Workflows

| Workflow | Job | Runs on | Gates |
| --- | --- | --- | --- |
| `quality.yml` | `quality` | ubuntu | audit, licenses, preflight, format, lint, typecheck, build, `pnpm test:run`, and the balance-report drift guard |
| `desktop-e2e.yml` | `desktop-e2e` | macos | build, Playwright Electron E2E, packaged `electron-builder --mac --dir`, and the packaged smoke (`smoke:packaged`) |
| `determinism.yml` | `determinism` | ubuntu/windows/macos | unit `pnpm test`, cross-process determinism, golden hashes |
| `commit-convention.yml` | `commit-msgs` | ubuntu | every pushed/PR commit subject is a Conventional Commit |

Two checks are easy to forget and both caught real problems: the **packaged
smoke** (dev-mode E2E cannot see production-CSP/file:// regressions) and the
**balance-report drift guard** (the reports are generated, so a stale or
hand-edited report must not merge).

## Branch protection (repository setting)

> **Prerequisites (account/plan, not code):** GitHub Actions must be enabled and
> the account's payment method healthy (`gh api repos/:owner/:repo/actions/permissions`
> must return `"enabled": true`), and **branch protection requires GitHub Pro or a
> public repository** — on a private repo without Pro the protection endpoints
> return HTTP 403. Until both hold, the workflows below exist but never run, and
> branch protection cannot be enforced. Do not add required status checks while
> Actions are disabled: no check would ever report, and every PR would be blocked.

Both `dev` and `main` must:

- require the status checks above (`Quality Gate / quality`, `Desktop E2E Gate /
  desktop-e2e`, `Determinism Gate / determinism`, `Commit Convention /
  commit-msgs`) and require them to be **up to date** before merge;
- disallow direct pushes / force-pushes;
- require a pull request before merging (per `AGENTS.md`: land work on `dev`,
  release `dev` → `main` via PR).

These are GitHub settings, not files — they must be enabled in the repository
UI/API; the workflow files above only define the checks they enforce.

## Push discipline

A commit must never reach `origin` before the checks above pass. If any process
or agent pushes to `dev` automatically, it must run the full gate first — or be
disabled in favour of the protected-PR flow.
