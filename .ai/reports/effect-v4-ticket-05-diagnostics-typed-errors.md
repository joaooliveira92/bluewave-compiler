# Validation Report: EFFECT-V4 ticket 05 — `diagnostics` typed-error foundation

## Outcome

`PASS`

## Scope delivered

Ticket `.scratch/effect-v4-vendor-migration/issues/05-diagnostics-typed-errors.md`
(Wave 1 beachhead; proves MIG-RUNTIME-1 for this package). `@bluewave/diagnostics`
becomes the **first real `workspace:*` consumer** of the vendored `effect`:

- `packages/diagnostics/package.json` gains `"effect": "workspace:*"` (kept
  `@bluewave/contracts`).
- New in-process error model `DiagnosticError extends Data.TaggedError(
  "DiagnosticError")<{ code; message; stage?; sourceLocation?; entityId?;
  relatedLocations?; remediation? }>` with `toDiagnostic()` projecting onto the
  plain `Diagnostic` shape. In-process domain error, runtime-free.
- `DiagnosticCollector` public behaviour and output are **unchanged** (no method,
  shape, or ordering change).
- `DiagnosticCode` unchanged (stable branded string; no string values altered; no
  `Schema` brand added — optional and skipped to avoid cross-package churn).

Deferred: no `Result` helper (optional), no `Schema.TaggedError` (that is the
wire idiom; diagnostics errors are in-process). Later waves own their own
`Data.TaggedError` types; the collector remains the single sink.

## Requirements evidence

| Requirement                            | Implementation                                                            | Proving test / evidence                                                                                  |
| -------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| MIG-RUNTIME-1                          | `packages/diagnostics/src/index.ts` imports only `{ Data }` from `effect` | `rg` shows no `Effect`/`Layer`/`ManagedRuntime`/ambient I/O in the package                               |
| Ticket AC1 (typed error + stable code) | `DiagnosticError` (`Data.TaggedError`)                                    | tests "is a tagged, yieldable Error…" + "projects onto a Diagnostic…"; `DiagnosticCode` source unchanged |
| Ticket AC2 (collector facade stable)   | collector untouched                                                       | test "collects identically to addError … (facade parity)" + byte-identical source diff                   |
| Ticket AC3 (runtime-free)              | `Data` only                                                               | import audit above                                                                                       |
| Ticket AC4 (tests)                     | 3 new tests                                                               | diagnostics 10/10                                                                                        |
| Ticket AC5 (focused + no regression)   | see commands                                                              | diagnostics typecheck/test green; full gate green                                                        |
| MIG-GRAPH-1/2 (still single copy)      | lockfile importer `link:../../vendor/effect`                              | `assert-single-effect.mjs` exit 0; no `effect@<version>` key                                             |

## Commands and observed results

```text
pnpm --filter @bluewave/diagnostics typecheck -> exit 0
pnpm --filter @bluewave/diagnostics test      -> 1 file / 10 tests passed; exit 0
node scripts/assert-single-effect.mjs         -> ok (no registry effect; workspace:vendor/effect); exit 0
pnpm preflight                                -> guard self-test 9/9; ok; docs-check ok (329 links, 102 ADRs); exit 0
pnpm format                                   -> All matched files use the correct format (2154 files); exit 0
pnpm lint                                     -> 0 warnings, 0 errors (1928 files); exit 0
pnpm lint:effect                              -> 249 warnings, 0 errors (1104 files); exit 0
pnpm -w turbo run build --force               -> Tasks: 20 successful, 20 total (0 cached); exit 0
pnpm -w turbo run typecheck --force           -> Tasks: 37 successful, 37 total (0 cached); exit 0
pnpm test:run                                 -> Test Files 241 passed; Tests 1554 passed; exit 0
node scripts/verify-golden-hashes.cjs         -> All 10 hashes match golden reference; exit 0
pnpm test:cross-process                       -> {"success":true, ...}; exit 0
```

Lockfile: diagnostics importer records `effect: {specifier: workspace:*,
version: link:../../vendor/effect}`; no registry `effect@<version>` entry.

Adversarial reviewer verdict: **APPROVE** (no blocker/high). Its LOW/NIT items
(root-barrel import footprint; strict-equality in the parity/boundary tests;
ticket-comment-only collector decision) are non-blocking. The suggested deep
import `effect/Data` was tried and does **not** export a `Data` namespace in
`effect@4.0.2`, so the reviewer-correct root-barrel `import { Data } from
"effect"` was retained.

## Determinism evidence

- Content artifact hash: `103c60d3f25d1f6ccf758416ef33754732f0f837ad8021d3985ee027d95bccd9`
- Closing snapshot hash: `bdc8d346ad7662be2911ffc839826f25a29eed937218351dd6e15de6a9c0efe5`
- Replay result: `replayVerificationHash 097f9929…`; `"success": true`
- Processes and operating systems used: two child processes, macOS (darwin-arm64), Node per repo engine

Goldens 10/10 unchanged (diagnostics has no hash surface). ADR-0103 note: the
determinism gate is deprecated; it was run and reports **unchanged** — no drift.

## Canonical artifact changes

None.

## Tests added

`packages/diagnostics/test/diagnostics.test.ts`: tagged-error construction
(`_tag`, `instanceof Error`, field values), `toDiagnostic()` projection
(error severity + default stage), and a projection↔`addError` facade-parity case
asserting byte-identical `toJSON()`/`toHuman()`.

## Security and cancellation

No new trust boundary; no ambient I/O. The tagged error is in-process only and
never crosses a wire boundary.

## Performance observations

None material. The package now loads the `effect` barrel at import (no runtime
executed); a future deep-import cleanup is possible if `effect@4.x` exposes a
`Data` subpath namespace.

## ADRs and dependencies

- New dependency: `effect` (vendored workspace package) — MIT, zero runtime deps.
- No new ADR owed (no hash-surface change; the collector-keep decision is
  recorded in the ticket comment per the spec's delegation).

## Known limitations and deferred requirements

- Only one error class (`DiagnosticError`, error severity). `DiagnosticCode`
  gained no `Schema` brand and no `Result` helper was added (both optional).
- Root-barrel `effect` import (no `effect/Data` namespace in 4.0.2).

## Changed files

- `packages/diagnostics/package.json` (add `effect` dep),
  `packages/diagnostics/src/index.ts` (add `DiagnosticError`; collector untouched),
  `packages/diagnostics/test/diagnostics.test.ts` (+3 tests), `pnpm-lock.yaml`
  (diagnostics importer link).
- Traceability: `.scratch/effect-v4-vendor-migration/issues/05-*.md` (ACs/status),
  `.ai/SPRINT-PLAN.md`, `docs/PROGRESS.md`, this report.

## Git and remote status

- Branch: `dev`
- Commits: see the accompanying `feat(diagnostics): add an Effect Data.TaggedError typed-error foundation` commit
- Working tree: clean after commit
- Push status: not pushed (local sprint; no push requested)
- Pull request: none
- Merge performed: no

## Secondary consistency check

Re-ran diagnostics typecheck/test/build and the full gate independently of the
implementator/reviewer reports. Confirmed the lockfile links the vendored copy
only, goldens/cross-process unchanged, and no files outside the ticket changed
(plus traceability).
