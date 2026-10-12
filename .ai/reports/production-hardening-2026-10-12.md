# Production hardening and release — session report

**Date:** 2026-10-12 · **Branch:** `dev` · **Driver:** production-readiness mission
(`.scratch/handoff/production-readiness-prompt.md`). Supersedes/extends
`.ai/reports/release-readiness-status.md` for the workstreams below.

## Environment

A second autonomous writer had landed the SB-3 shipbuilding sprint on `dev` before
this session. At session start `origin/dev` was `762fb40f` and `dev` was 5 commits
ahead; no rival process was active, the tree was clean, and no conflict markers or
in-progress merge were present. State was re-derived from Git before every write;
every change landed as a small, immediate commit with **explicit pathspecs** (no
`git stash`/`reset`/`add -A`). `dev` is now a clean fast-forward over `origin/dev`.

## Recon (WS0)

| Gate                                    | Result at session start                                                         |
| --------------------------------------- | ------------------------------------------------------------------------------- |
| `pnpm preflight`                        | **11/11** (green)                                                               |
| `pnpm format`                           | **red** — `.ai/reports/release-readiness-status.md` unformatted (prior session) |
| `node scripts/verify-golden-hashes.cjs` | all 10 match                                                                    |
| `pnpm check`                            | not runnable as a gate (see WS2)                                                |

## Workstreams

### WS2 — determinism is now gating — DONE

`pnpm check` never ran the golden gate (the doc claimed it did), so local "green"
was not CI green.

- `package.json`: `check` now runs `check:golden` (`verify-golden-hashes.cjs`), a
  new `check:determinism` (`verify-cross-process-determinism.cjs`, two child runs
  byte-identical), and `check:golden-repin`.
- `scripts/verify-golden-repin.mjs` + `scripts/golden-repin.baseline`: fails a
  commit that edits authoritative `packages/*/src/**` or `content/production/**`
  without re-pinning `golden/hashes.json` in the same commit; a deliberate
  no-output change records `Golden-Repin: not-needed`. Pre-guard history is
  grandfathered at the baseline SHA (`bee03042`). Wired into `quality.yml`
  (`fetch-depth: 0`). Fixtures in `scripts/test/`.
- `docs/agents/golden-repinning.md` updated to match reality.

### WS3 — formatting at commit time — DONE

`scripts/precommit-staged.mjs` runs `vp fmt --check` over the staged files;
`.githooks/pre-commit` calls it before the preflight set, so unformatted code
cannot enter history (was: only caught later by CI). Verified by the hook running
on this session's own commits.

### WS4 — test-suite signal quality — DONE

- **base-ui `act()` flood fixed.** `sections.aggregate.test.tsx` runs under fake
  timers (`setTimeout`, `requestAnimationFrame`); `tabTo`/close interactions
  advance the base-ui delay inside `act`, and an `afterEach` drains stragglers
  before unmount. `grep -c "not wrapped in act"` drops **109 → 0**, 15/15 tests
  pass. `.scratch/test-hygiene/issues/01` resolved.
- **Heavy suites isolated.** The 36-month campaign regression and AI-procurement
  simulation are excluded from the default phase-engine suite
  (`packages/phase-engine/vitest.config.ts`, `BLUEWAVE_HEAVY`) and run by
  `pnpm test:heavy` (`scripts/run-heavy-tests.mjs`, `--maxWorkers=2`), wired into
  `quality.yml` and `pnpm check`. Default phase-engine: 31 files/303 tests;
  heavy: 2 files/12 tests (36mo 1.8s, procurement 5.0s max).

### WS5 — tracker truth — DONE

`scripts/verify-tracker-consistency.mjs` (wired into `pnpm preflight`): fails on
(i) a `Blocked by:` reference to a missing ticket and (ii) a spec still advertising
`ready-for-agent`/`ready for slicing` whose tickets are all terminal. Structural
gaps (legacy ticket formats) are warnings. Real tree: 0 errors.
`.scratch/release-readiness/spec.md` marked done; `.scratch/doc-reconciliation/`
and `.scratch/test-hygiene/` tickets resolved. Fixtures in `scripts/test/`.

### WS6 — crash/observability hardening (ADR-0133) — DONE

`apps/desktop/src/main/crashSupport.ts`:

- **Redaction** — the crash context carries `homeDir`; message and stack are
  redacted (home → `~`, remaining `/Users|/home/<name>` → `[user]`) and truncated
  (8 KB/64 KB). Closes the gap between the ADR's "no filesystem paths" claim and
  the implementation.
- **Bounded writes** — `createCrashLimiter` caps writes (`5/60s`) and dedups an
  identical crash; the support dir keeps the newest 20 bundles, pruning the rest.
- **Packaged proof** — `packaged-smoke.mjs` forces a real uncaught renderer error
  in the packaged binary and asserts the bundle is written and local-only, after
  the pageerror assertions so the deliberate crash cannot trip them.
- Tests: 15 pass; a test asserts neither capture-path file reaches the network.
  ADR-0133 amended.

### WS7 — design-doc / ADR record — DONE

`scripts/docs-check.cjs` enforces AMENDMENTS.md ↔ each DESIGN doc's `Amended by:`
header and that every DESIGN-referencing ADR is classified; `pnpm preflight` is
green (13/13). `.scratch/doc-reconciliation/issues/01` resolved.

### WS8 — versioning and changelog — DONE

- **ADR-0134** (versioning + changelog policy); registered in `adr-index.cjs` and
  `docs/adr/README.md` regenerated.
- `scripts/changelog.mjs` drafts a per-type section from Conventional Commit
  subjects (`--from`, `--version`, `--out`); `CHANGELOG.md` stays human-authored.
- `scripts/verify-version-coherence.mjs` (in `pnpm preflight`): desktop version ==
  `CURRENT_COMPATIBILITY_VERSION`.

### WS1 — cut the release — BLOCKED (precise report)

Preparation is complete and verified:

- `apps/desktop/package.json` → **1.2.0** (== `CURRENT_COMPATIBILITY_VERSION`);
  `CHANGELOG.md` "Unreleased" moved under `## 1.2.0 — 2026-10-12` with a fresh
  empty Unreleased section. Fail-fast version-coherence gate added.
- Goldens re-verified (10/10) and cross-process determinism proven.
- Tag **`v1.2.0`** pushed; `release.yml` ran and **failed to build installers**.
  The dry-run found two genuine, previously-undocumented packaging bugs plus the
  documented credential/icon gaps.

**Blocker 1 — signing credentials are not configured (the reason no signed
release can be produced).** `gh secret list` is empty; each job's `CSC_LINK`,
`CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`,
`WIN_CSC_LINK`, `WIN_CSC_KEY_PASSWORD` is empty. With an empty `CSC_LINK`,
electron-builder tried to import a certificate from an empty path and failed
cryptically (`apps/desktop not a file`). Fixed in `release.yml`: the mac and win
jobs now **fail fast with `::error`** naming the missing secrets. Provision them
with `scripts/release-signing-wizard.sh` (see `docs/delivery/desktop-signing.md`).

**Blocker 2 — app icons are 1×1 placeholder stubs.** `build/icon.icns` and
`build/icon.ico` are 70-byte 1×1 PNGs. Windows fails with "Icon is not a valid ICO
file". Real artwork (1024² PNG → icns/ico) is a design task, tracked in
`docs/delivery/desktop-signing.md` §Gaps.

**Fixed in this session (genuine packaging bugs):**

- `electron-builder.yml`: added `linux.executableName: bluewave` — without it the
  AppImage rejected the derived name `@bluewavedesktop` ("characters that cannot
  be safely used in file paths"). Linux packaging was broken.
- `release.yml`: fail-fast credential guards (mac + win) instead of a cryptic
  builder error.
- macOS unsigned packaging verified locally:
  `CSC_IDENTITY_AUTO_DISCOVERY=false electron-builder --mac --dir` →
  `skipped macOS application code signing`, app packaged.

**CI hardening discovered while landing the above (both were red required checks):**

- `pnpm audit` surfaced new high advisory **GHSA-68fv-2mgg-jv7q**
  (`source-map-js <1.2.2`, via postcss/vitest). Pinned `source-map-js: 1.2.2` in
  `pnpm-workspace.yaml` overrides; `pnpm audit --prod` → clean.
- `docs-check` reported the ADR index stale on Windows (CRLF checkout); now
  compares with normalized line endings.
- `link-claude-skills` test failed on Windows (backslash symlink targets); the
  script now writes POSIX-stable targets.

**Next release attempt:** once the secrets and icons exist, re-tag from the fixed
`dev` head (new patch version, or r-run the Release workflow) — the tag `v1.2.0`
itself is not moved (no force-push).

## Validation

| Gate                                                                                                                                                               | Result                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `pnpm preflight`                                                                                                                                                   | **13/13** (incl. tracker-consistency + version-coherence)                                                |
| `pnpm test:scripts`                                                                                                                                                | **86** pass                                                                                              |
| `pnpm audit --prod --audit-level=high`                                                                                                                             | clean (after the override)                                                                               |
| `pnpm check` (full chain: preflight, format, lint, lint:effect, licences, typecheck, build, test:run, test:heavy, golden, determinism, golden-repin, balance, e2e) | **green** on the release-prep commit `fb80f52e` (e2e 33/33; goldens 10/10; cross-process byte-identical) |
| `node scripts/verify-golden-hashes.cjs`                                                                                                                            | all 10 match                                                                                             |
| `node scripts/verify-cross-process-determinism.cjs`                                                                                                                | two runs byte-identical                                                                                  |
| release `v1.2.0` workflow                                                                                                                                          | failed — blockers above                                                                                  |

## Files changed (by workstream)

- **WS2/WS3:** `package.json`, `scripts/verify-golden-repin.mjs`,
  `scripts/verify-cross-process-determinism.cjs`, `scripts/golden-repin.baseline`,
  `scripts/precommit-staged.mjs`, `.githooks/pre-commit`, `docs/agents/golden-repinning.md`,
  `.github/workflows/quality.yml`, `scripts/test/verify-golden-repin.test.mjs`.
- **WS4:** `.../hull-plan/sections.aggregate.test.tsx`,
  `packages/phase-engine/vitest.config.ts`, `scripts/run-heavy-tests.mjs`,
  `.scratch/test-hygiene/issues/01-*.md`.
- **WS5:** `scripts/verify-tracker-consistency.mjs` (+ test), `scripts/run-gates.mjs`,
  `.scratch/release-readiness/spec.md`, `.scratch/doc-reconciliation/issues/01-*.md`.
- **WS6:** `apps/desktop/src/main/crashSupport.ts` (+ test), `index.ts`,
  `apps/desktop/scripts/packaged-smoke.mjs`, `docs/adr/ADR-0133-*.md`.
- **WS8:** `docs/adr/ADR-0134-*.md`, `docs/adr/README.md`, `scripts/adr-index.cjs`,
  `scripts/changelog.mjs` (+ test).
- **WS1:** `apps/desktop/package.json`, `CHANGELOG.md`,
  `scripts/verify-version-coherence.mjs` (+ test), `apps/desktop/electron-builder.yml`,
  `.github/workflows/release.yml`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`,
  `scripts/docs-check.cjs`, `scripts/link-claude-skills.mjs`.
- **Reports:** this file.
