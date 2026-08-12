# Validation Report: A-5 — M1 Formal Acceptance Gate (`M1_STRATEGIC_CAMPAIGN_KERNEL`)

## Outcome

`PASS` — M1 signed `COMPLETED` (DESIGN-55 §23) for the scoped capability closure
recorded in ADR-0011.

## Scope delivered

A documentation/acceptance gate (no engine, content, or hash change):

- Applied DESIGN-55 §9 to every M1 capability and materialized the M1 capability
  registry + evidence (`docs/acceptance/m1-capability-registry.md`).
- Reconciled `docs/OPEN-ISSUES.md`: the "126 items" figure is a migration-time
  lexical audit snapshot; zero `OPEN DECISION` markers remain; M1 residuals closed
  by ADR-0001…0011.
- Refreshed `docs/PROGRESS.md` (M1 COMPLETED + the corrected open-issues text).
- Recorded the deployment/DESIGN-25 scope decision as ADR-0011.
- Ran the full validate suite and executed a clean-uncached rebuild plus golden
  verification (below).

## Requirements evidence

Per-capability evidence table: `docs/acceptance/m1-capability-registry.md`.
All ten scoped M1 capability families are `ACCEPTED`; deployment is
`CONTENT_ONLY` (deferred) with the limitation recorded, not hidden.

## Commands and observed results

```text
pnpm -w turbo run build --force
> 17 successful, 17 total (clean, uncached; 0 cached)

pnpm exec tsc -b
> (clean — no errors)

pnpm exec vp test run
> Test Files 1 failed | 40 passed (41)
> Tests      410 passed (410)
> failure = packages/content-schema/test/nation.test.ts
>   ERR: Cannot find module '../../../content/research/nations/1880/index.ts'
>   (pre-existing broken import; separately tracked; not M1-scoped)

node packages/cross-process-test/dist/run-child.js  (run twice)
> both runs byte-identical (cmp OK); output hash f7c340c4d73818e40d1816c0eae72a96…
> also byte-identical to the pre-A5 formatted run (no behavioral drift)

pnpm exec vp test run packages/cross-process-test/test/cross-process.test.ts
> 1 file / 2 tests passed

node scripts/verify-golden-hashes.cjs
> All 8 hashes match golden reference

pnpm exec vp lint .
> Found 0 warnings and 1 error (the same pre-existing nation.test.ts broken import)

pnpm format
> All matched files use the correct format.
```

## Determinism evidence

- Content / initial / closing / command / event / financial / random ledger
  hashes: **unchanged** by this gate (golden 8/8). A-5 authored no authoritative
  data.
- Replay: reproduce-verified by prior sprints; unchanged here.
- Child-process determinism: two independent runs byte-identical.
- Processes/OS: macOS (darwin), Node 24, TypeScript 7.

## Canonical artifact changes

None. ADR-0011, the registry, and the report are traceability/scope records with
no simulation or persistence impact.

## Tests added

None (gate sprint). No skipped or weakened tests.

## Security and cancellation

No new trust boundary. Untrusted YAML boundaries (Zod strict schemas) and the
command lifecycle remain as previously ACCEPTED. No long-running I/O changed.

## Performance observations

None measured; no authoritative data added.

## ADRs and dependencies

- **ADR-0011** — M1 acceptance scope: deployment (DESIGN-25) is `CONTENT_ONLY`/
  deferred out of the M1 completion closure; required at §20 for full scenario
  support at REL-1. No dependency added.

## Known limitations and deferred requirements

- Deployment (DESIGN-25) is NOT `ACCEPTED`; M1 is complete for its scoped
  closure only. Requires its own scoping/implementation sprint before
  `FULLY_SUPPORTED` (§17) at REL-1.
- Pre-existing broken import `content-schema/test/nation.test.ts` (canonical
  nation-corpus-home decision; repair deferred to owner at final validation).
- Packaged-smoke framework, capability-readiness machine, scenario support
  manifest, era-coverage matrix, release validation: deferred to REL-1 (recorded,
  not claimed).

## Changed files

- `docs/adr/ADR-0011-m1-acceptance-deployment-scope.md` (new)
- `docs/acceptance/m1-capability-registry.md` (new)
- `docs/OPEN-ISSUES.md` (reconciled)
- `docs/PROGRESS.md` (M1 COMPLETED; corrected open-issues text)
- `.ai/SPRINT-PLAN.md` (A-5 done; pointer advanced to CONTENT-3 IMPL)
- Lint/format hygiene: removed 5 unused-identifier / duplicate-key lint errors in
  `phase-engine/test/ai-scenario.test.ts`, `phase-engine/test/diplomacy-war.test.ts`,
  `campaign/src/compiler.ts`, `apps/desktop/src/main/project.ts`; applied repo
  formatter (cosmetic only — verified by identical child-process output + golden).

## Git and remote status

- Branch: `dev`
- Commits: A-5 gate commit (docs + lint/format hygiene)
- Working tree: clean after commit
- Push status: pushed to `origin/dev`
- Pull request: none (dev is the deliver branch)
- Merge performed: `no`

## Secondary consistency check

Independent uncached rebuild (17/17), `tsc -b` clean, full suite 410 pass,
child run twice byte-compared and byte-identical to the pre-format run,
verify-golden 8/8, lint reduced to the single pre-existing error, format clean —
all correlated against the observed outputs rather than trusted blindly.
