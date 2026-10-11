# Validation Report: EFFECT-V4 Wave 0 exit gate (ticket 04)

## Outcome

`PASS`

## Scope delivered

Orchestrator-run acceptance of **Wave 0 — Vendor & toolchain** for the
`.scratch/effect-v4-vendor-migration/` effort (ticket
`04-wave0-exit-gate.md`, proving MIG-WAVE0-ENTRY, MIG-WAVE0-EXIT, MIG-RB-0,
MIG-GATE-1). No product/domain code changes. Wave 0 is now signed off; ticket 05
(Wave 1, `diagnostics` typed-error foundation) is the frontier.

## Requirements evidence

| Requirement                | Evidence                                                                                                                                                              |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MIG-WAVE0-ENTRY            | on `dev` (0 behind `origin/dev`); `pnpm preflight` green; no in-progress merge/rebase, no conflict markers                                                            |
| MIG-WAVE0-EXIT (vendor)    | `node scripts/vendor-effect-sync.mjs --verify` → effect@4.0.2 + @effect/vitest@4.0.2 match the published tarballs                                                     |
| MIG-WAVE0-EXIT (guard)     | `pnpm preflight` runs `scripts/assert-single-effect.mjs` (self-test 9/9; real lockfile ok — no registry `effect`); `lint:effect` `duplicatePackage: error` → 0 errors |
| MIG-WAVE0-EXIT (lint gate) | `pnpm lint:effect` → 246 warnings, 0 errors; `pnpm lint` (`vp lint`) → 0/0                                                                                            |
| MIG-REF-1                  | `repos/effect` subtree present; excluded from `vp lint`/`vp fmt` (`vite.config.ts`) and editor search (`.vscode/settings.json`); `AGENTS.md` documents it             |
| MIG-GATE-1                 | `pnpm check` → EXIT 0 end-to-end (incl. 30 e2e)                                                                                                                       |
| MIG-RB-0                   | rollback point recorded: baseline `95efface` → Wave 0 commits `6fc7ed9d`, `2e8db356`+`d01a3736`, `cc7eec0f`, `5002edad`; no domain code to unwind                     |

## Commands and observed results

```text
git branch --show-current                  -> dev
git rev-list --left-right --count HEAD...origin/dev -> 2  0   (ahead by the Wave 0 commits; 0 behind)
pnpm preflight                             -> guard self-test 9/9; ok; docs-check ok (329 links, 102 ADRs); EXIT 0
node scripts/vendor-effect-sync.mjs --verify -> verify ok: effect@4.0.2, @effect/vitest@4.0.2 match the published tarballs; EXIT 0
pnpm lint:effect                           -> Found 246 warnings and 0 errors (1104 files, 150 rules); EXIT 0
pnpm lint                                  -> 0 warnings, 0 errors (1928 files); EXIT 0
pnpm check                                 -> EXIT 0 end-to-end (preflight, format, lint, lint:effect, licenses, typecheck, build, test:run, balance-reports, e2e 30 passed)
node scripts/verify-golden-hashes.cjs      -> All 10 hashes match golden reference; EXIT 0
pnpm test:cross-process                    -> {"success":true, ...}; EXIT 0
git diff --name-only 95efface..HEAD | grep -E '^(packages/|apps/)' -> (empty: zero domain-package changes)
```

Non-vendor/repos Wave 0 delta: `.gitignore`, `.vscode/settings.json`, `AGENTS.md`,
`agent-patterns/effect-idioms.md`, `vite.config.ts`, `tsconfig.base.json`,
`turbo.json`/`package.json`/`pnpm-workspace.yaml`/`pnpm-lock.yaml`,
`oxlint.effect.json`, `scripts/{vendor-effect-sync,assert-single-effect,adr-index}.cjs|mjs`,
`docs/adr/*` (+ADRs 0100–0103), `docs/architecture/determinism-and-randomness.md`,
and traceability records (`.ai/SPRINT-PLAN.md`, `.ai/reports/*`, `docs/PROGRESS.md`,
`.scratch/effect-v4-vendor-migration/*`). All within the allowed Wave 0 surface.

## Determinism evidence

- Content artifact hash: `103c60d3f25d1f6ccf758416ef33754732f0f837ad8021d3985ee027d95bccd9`
- Closing snapshot hash: `bdc8d346ad7662be2911ffc839826f25a29eed937218351dd6e15de6a9c0efe5`
- Replay result: `replayVerificationHash 097f9929…`; `"success": true`
- Processes and operating systems used: two child processes, macOS (darwin-arm64), Node per repo engine

Goldens 10/10 unchanged. **Note:** ADR-0103 (per the pre-existing human decision
in adoption ticket 05, 2026-08-16) demotes the determinism/golden gate to
deprecated informational machinery; Wave 0 nevertheless ran it and reports it
**unchanged** — no drift occurred.

## Canonical artifact changes

None.

## Tests added

None (gate ticket).

## Security and cancellation

No runtime surface. Validated that `@effect/tsgo` is external to `vendor/`, the
vendor tree is byte-verified, and `repos/effect` is never imported.

## Performance observations

`pnpm check` end-to-end completes within the usual envelope; no regression.

## ADRs and dependencies

- Wave 0 ADRs: ADR-0100..0103 (adopt / vendor / Zod→Schema / DESIGN-08 demotion).
- Toolchain devDeps: `@effect/tsgo@0.51.1`, `oxlint@1.87.0`,
  `oxlint-tsgolint@7.0.2003` (exact).

## Known limitations and deferred requirements

- Determinism lint rules remain warnings; `erasableSyntaxOnly` not enabled
  (recorded in ADR-0101).
- Wave 1+ (error model, Zod→Schema across boundaries, runtime adoption) is
  deferred to tickets 05+.

## Changed files

- Traceability only: `.scratch/effect-v4-vendor-migration/issues/04-wave0-exit-gate.md`
  (ACs/status/comments), `.scratch/effect-v4-vendor-migration/issues/05-*.md`
  (frontier flag), `.ai/SPRINT-PLAN.md`, `docs/PROGRESS.md`, this report.

## Git and remote status

- Branch: `dev`
- Commits: see the accompanying `chore(effect): pass the Wave 0 exit gate and record the rollback point` commit
- Working tree: clean after commit
- Push status: not pushed (local sprint; no push requested)
- Pull request: none
- Merge performed: no

## Secondary consistency check

Re-ran the guard/self-test, vendor verify, `lint:effect`, golden verify, and
cross-process independently of the implementator reports. Confirmed zero
`packages/**`/`apps/**` changes in the Wave 0 delta and a clean working tree.
