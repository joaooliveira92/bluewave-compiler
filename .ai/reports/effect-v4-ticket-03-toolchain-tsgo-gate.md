# Validation Report: EFFECT-V4 ticket 03 — `@effect/tsgo` lint gate, tsconfig policy, ADR set

## Outcome

`PASS`

## Scope delivered

Ticket `.scratch/effect-v4-vendor-migration/issues/03-toolchain-tsgo-lint-adrs.md`
(proves MIG-VENDOR-5, MIG-REF-1, MIG-ADR-1, MIG-RUNTIME-1). Wave 0 toolchain:

- `@effect/tsgo` pinned **exact `0.51.1`** as a devDependency, **external** to
  `vendor/` (no `vendor/@effect/tsgo`), alongside exact `oxlint@1.87.0` +
  `oxlint-tsgolint@7.0.2003` matching the versions `vite-plus@1.1.0` resolves.
- New `oxlint.effect.json` extends `@effect/tsgo/oxlint-presets/recommended.json`,
  enables the native `effecttsgo` plugin with `options.typeAware: true`, sets
  `duplicatePackage` to **error**, and the five determinism rule pairs
  (`globalRandom`/`globalDate`/`cryptoRandomUUID`/`processEnv`/
  `nodeBuiltinImport` + their `-in-effect` variants) to **warn** per the runtime
  policy. `ignorePatterns` exclude `vendor/**`, `repos/**`, `**/dist/**`,
  renderer/preload, `cross-process-test`, `test-support`.
- New root `lint:effect` script (`effect-tsgo patch --no-typescript --oxlint &&
  oxlint --config oxlint.effect.json packages apps`), wired into `pnpm check`
  after `pnpm lint`. `vp lint` is unchanged. `tsconfig.base.json` gains the
  documented `@effect/language-service` plugin `diagnostics:false` (additive;
  `tsc` ignores `plugins`).
- `AGENTS.md` documents the Effect lint gate, `duplicatePackage`, and the exact
  tsgo pins (MIG-REF-1 was already satisfied by tickets 01/02).
- Four ADRs **ADR-0100 Adopt Effect v4**, **ADR-0101 Vendor Effect**,
  **ADR-0102 Replace Zod with Effect Schema**, **ADR-0103 DESIGN-08 determinism
  spine demoted**; ADR index, `AMENDMENTS.md`, DESIGN-08 header, and
  `scripts/adr-index.cjs` updated.

Deferred (by design): `erasableSyntaxOnly` **not enabled** (existing consumer
code uses `enum`/`namespace`/parameter properties; enabling would expand Wave 0
into out-of-scope domain rewrites) — recorded in ADR-0101. `lint:effect` scope is
`packages apps` (root `scripts/**`/`vite.config.ts` are Effect-free today).

## Requirements evidence

| Requirement             | Implementation                                                                   | Proving test / evidence                                                         |
| ----------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| MIG-VENDOR-5            | `package.json` `@effect/tsgo` `0.51.1`; `oxlint.effect.json`; `lint:effect`      | no `vendor/@effect/tsgo`; `pnpm lint:effect` → 0 errors (1104 files, 150 rules) |
| MIG-GRAPH-1 (reinforce) | `effecttsgo/duplicate-package: error`; `scripts/assert-single-effect.mjs`        | guard exit 0 + self-test 9/9 in `pnpm preflight`                                |
| MIG-REF-1               | `AGENTS.md` vendored-reference + lint section; `agent-patterns/effect-idioms.md` | `docs-check` ok (329 links)                                                     |
| MIG-RUNTIME-1           | determinism rules warn; runtime-free vs full-Effect boundary in ADR-0100/0103    | ADR-0100 decision 2 table; ADR-0103 reconciliation clause                       |
| MIG-ADR-1               | ADR-0100..0103 + index/AMENDMENTS/DESIGN-08                                      | `docs-check` ok (102 ADRs indexed); index ⇄ file Status agreement enforced      |

## Commands and observed results

```text
pnpm add -D -E -w @effect/tsgo              -> + @effect/tsgo 0.51.1
pnpm add -D -E -w oxlint@1.87.0 oxlint-tsgolint@7.0.2003 -> exact pins, no conflict with vite-plus
pnpm lint:effect                            -> Found 246 warnings and 0 errors (1104 files, 150 rules); EXIT 0; idempotent (git status unchanged)
pnpm -w turbo run build --force             -> Tasks: 20 successful, 20 total (0 cached); EXIT 0
pnpm -w turbo run typecheck --force         -> Tasks: 37 successful, 37 total (0 cached); EXIT 0
pnpm lint                                   -> 0 warnings, 0 errors (1928 files); EXIT 0
pnpm format                                 -> All matched files use the correct format (2152 files); EXIT 0
pnpm preflight                              -> guard self-test 9/9; ok; docs-check ok (329 links, 102 ADRs); EXIT 0
pnpm test:run                               -> Test Files 241 passed; Tests 1554 passed; EXIT 0
node scripts/verify-golden-hashes.cjs       -> All 10 hashes match golden reference; EXIT 0
pnpm test:cross-process                     -> {"success":true, ...}; EXIT 0
node scripts/assert-single-effect.mjs       -> ok (no registry effect; workspace:vendor/effect); EXIT 0
```

Adversarial reviewer verdict: **APPROVE**. Repairs applied from its findings:
reconciled the ADR-0100 ↔ ADR-0103 runtime-authority conflict (ADR-0103 decision
1 now scopes the lift to the determinism axis and cross-references the
runtime-usage boundary), removed the dead `turbo.json` `lint:effect` task, and
corrected the `vp lint` rationale in ADR-0101 + ticket comments.

## Determinism evidence

- Content artifact hash: `103c60d3f25d1f6ccf758416ef33754732f0f837ad8021d3985ee027d95bccd9`
- Closing snapshot hash: `bdc8d346ad7662be2911ffc839826f25a29eed937218351dd6e15de6a9c0efe5`
- Replay result: `replayVerificationHash 097f9929…`; `"success": true`
- Processes and operating systems used: two child processes, macOS (darwin-arm64), Node per repo engine

Goldens 10/10 unchanged. This ticket changes only toolchain/docs; no domain code.

> Note: ADR-0103 (per the pre-existing human decision in adoption ticket 05,
> 2026-08-16) demotes the determinism/golden gate to deprecated informational
> machinery. This ticket keeps running the determinism harness anyway and reports
> it as **unchanged** here — no drift occurred.

## Canonical artifact changes

None (no domain code). `pnpm-lock.yaml` gained the three toolchain devDeps and
their platform binaries (lockfile-only; `--frozen-lockfile` self-consistent).

## Tests added

- No new unit tests (toolchain/docs). The lint gate itself is proven by firing:
  a probe tripped `global-date`/`global-random` and a bare `Effect.succeed(1)`
  tripped `floating-effect` (exit 1); both probes were removed.

## Security and cancellation

No runtime security/abort surface. The `effect-tsgo patch --oxlint` step is
idempotent and does not mutate tracked files (verified: `git status` unchanged
across repeated runs); `@effect/tsgo` is a native binary declared external to
`vendor/` and is skipped from the workspace graph.

## Performance observations

`lint:effect` ~2.3s on 1104 files. Added to `pnpm check`; no measurable
regression to build/test.

## ADRs and dependencies

- **ADR-0100** Adopt Effect v4; **ADR-0101** Vendor Effect (V1 layout, wrapper,
  sync, single-copy, zero-patch, `repos/effect`, `duplicatePackage`, tsconfig
  policy incl. `erasableSyntaxOnly` decision); **ADR-0102** Replace Zod with
  Effect Schema; **ADR-0103** DESIGN-08 determinism spine demoted.
- New devDependencies: `@effect/tsgo@0.51.1`, `oxlint@1.87.0`,
  `oxlint-tsgolint@7.0.2003` (exact). License/maintenance: Effect is MIT,
  actively maintained; tsgolint is the pinned Oxlint type-aware invoker already
  used transitively by vite-plus. Determinism assessment: none of these affect
  authoritative output.

## Known limitations and deferred requirements

- `erasableSyntaxOnly` not enabled (recorded decision, ADR-0101).
- ADR-0103's determinism-gate demotion is a pre-authorized owner decision
  (adoption ticket 05); the deprecated harness is retained, not removed.
- Determinism lint rules are warnings (not errors) because existing
  boundary/domain code legitimately uses ambient time/node builtins; intended to
  be promoted per-package as waves migrate. ~240/246 warnings are test-only noise.
- `lint:effect` scope is `packages apps` (not root `scripts/**`).

## Changed files

- Toolchain: `oxlint.effect.json` (new), `package.json`, `turbo.json`,
  `tsconfig.base.json`, `pnpm-lock.yaml`, `AGENTS.md`.
- Docs/ADRs: `docs/adr/ADR-0100..0103` (new), `docs/adr/README.md`,
  `docs/adr/AMENDMENTS.md`, `docs/architecture/determinism-and-randomness.md`,
  `scripts/adr-index.cjs`.
- Traceability: `.scratch/effect-v4-vendor-migration/issues/03-*.md`,
  `.ai/SPRINT-PLAN.md`, `docs/PROGRESS.md`, this report.
- Out-of-ticket: `.ai/reports/effect-v4-ticket-02-vendor-workspace-guard.md`
  (format-only table alignment; the committed file failed `vp fmt --check`).

## Git and remote status

- Branch: `dev`
- Commits: see the accompanying `chore(effect): add the @effect/tsgo lint gate, tsconfig policy, and governing ADRs` commit
- Working tree: clean after commit
- Push status: not pushed (local sprint; no push requested)
- Pull request: none
- Merge performed: no

## Secondary consistency check

Re-read every changed file after the reviewer repairs; re-ran `pnpm format`,
`pnpm preflight`, and `pnpm lint:effect`. Confirmed the ADR index ⇄ file Status
agreement holds, `lint:effect` is idempotent with no tracked-file mutation, and
goldens/cross-process are unchanged. `vendor/**`/`repos/**` untouched.
