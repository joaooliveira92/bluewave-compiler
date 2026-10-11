# Validation Report: EFFECT-V4 ticket 11 — `campaign-engine` priorities Effect Schema boundary

## Outcome

`PASS`

## Scope delivered

Ticket `.scratch/effect-v4-vendor-migration/issues/11-boundary-campaign-engine-priorities.md`
(Wave 2). `packages/campaign-engine/src/priorities.ts`'s two Zod enums migrated to
Effect Schema; `effect` added to the package (it had no declared `zod` dependency —
the import resolved via hoisting, now removed). Proves **MIG-ZOD-1**.
Runtime-free, behaviour-preserving.

- `prioritySeveritySchema` `z.enum([...])` → `Schema.Literals([...])` (order preserved).
- `strategicPriorityTypeSchema` `z.enum([...])` → `Schema.Literals([...])` (order preserved).
- `PrioritySeverity` / `StrategicPriorityType` → `typeof s.Type`.
- No decode call site (these schemas are type-only; zero consumers). Projection
  body, sort, and output untouched.

## Requirements evidence

| Requirement                           | Implementation                  | Proving evidence                                                                                                              |
| ------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| MIG-ZOD-1                             | two `Schema.Literals`; zod gone | `rg '"zod"\|from "zod"' packages/campaign-engine` → empty; single-copy guard ok                                               |
| literal unions structurally identical | `typeof s.Type`                 | exhaustive `Record<PrioritySeverity, number>` / `Record<StrategicPriorityType, number>` + switches compile (`pnpm typecheck`) |
| pure/runtime-free                     | only `Schema` imported          | grep: no `Effect`/`Layer`/`ManagedRuntime`                                                                                    |
| package test + typecheck              | —                               | `pnpm --filter @bluewave/campaign-engine test` 15 files / 102 tests; typecheck clean                                          |

## Commands and observed results

```text
pnpm -w turbo run build --force              -> 20 successful / 20 total (uncached), exit 0
pnpm -w turbo run typecheck --force          -> 37 successful / 37 total (uncached), exit 0
pnpm check                                   -> EXIT 0 (preflight/format/lint/lint:effect/licenses/
                                                typecheck/build/test:run 241 files/1554 tests/balance/e2e 30)
node scripts/verify-golden-hashes.cjs        -> All 10 hashes match golden reference
pnpm test:cross-process (x2)                 -> byte-identical, success:true
pnpm --filter @bluewave/campaign-engine test -> 15 files / 102 tests passed
rg '"zod"|from "zod"' packages/campaign-engine -> no matches
node scripts/assert-single-effect.mjs        -> ok (no registry effect; workspace:vendor/effect)
```

Adversarial reviewer verdict: **APPROVE** (LOW-only: root `zod` devDep correctly
retained until ticket 14; no runtime parity test needed since the schemas are
never parsed).

## Determinism evidence

Content `103c60d3…`, snapshot opening `16708259…` / closing `bdc8d346…`, command
`48fa215f…`, event `26af2cf3…`, financial `b5b481d9…`, random `cb9e67f9…`, replay
`097f9929…`, battle-generation `dcdb85c4…` — two child processes, macOS
(darwin-arm64), byte-identical, `success: true`. Goldens 10/10 unchanged.

## Canonical artifact changes

None. Type-only change; projection output and sort unchanged.

## Tests added

None (schemas are type-only, never parsed; existing 102 campaign-engine tests +
the exhaustive type maps are the equivalent guarantee).

## Security and cancellation

N/A — no validation boundary gain/loss; no I/O.

## Performance observations

None.

## ADRs and dependencies

No new ADR. Dependencies: `effect` added (`workspace:*`) to `campaign-engine`; no
`zod` entry existed to remove.

## Known limitations and deferred requirements

Root `zod` devDependency retained until ticket 14 (removes it everywhere).

## Changed files

- `packages/campaign-engine/src/priorities.ts`, `packages/campaign-engine/package.json`,
  `pnpm-lock.yaml`; traceability: ticket 11, `.ai/SPRINT-PLAN.md`, `docs/PROGRESS.md`,
  this report.

## Git and remote status

- Branch: `dev`; Commits: see the accompanying
  `feat(campaign-engine): migrate priorities enums to Effect Schema (ticket 11)` commit;
  Working tree: clean after commit; Push: not pushed; PR: none; Merge: no

## Secondary consistency check

Re-ran forced build (20/20), forced typecheck (37/37), full `pnpm check` (exit 0,
e2e 30), golden verify (10/10), and two cross-process runs (byte-identical). Confirmed
no `zod` remains in `packages/campaign-engine`, the package stays runtime-free, and the
single-copy guard is green.
