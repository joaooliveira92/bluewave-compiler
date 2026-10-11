# Validation Report: EFFECT-V4 Wave 1 exit gate (ticket 07)

## Outcome

`PASS`

## Scope delivered

Orchestrator-run acceptance of **Wave 1 — Error + IO beachhead** for the
`.scratch/effect-v4-vendor-migration/` effort (ticket `07-wave1-exit-gate.md`,
proving MIG-WAVE1-ENTRY, MIG-WAVE1-EXIT, MIG-RB-1, MIG-GATE-1). Wave 1 is signed
off; ticket 08 (Wave 2 — content-schema validation boundary) is the frontier.

## Requirements evidence

| Requirement                 | Evidence                                                                                                                                           |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| MIG-WAVE1-ENTRY             | Wave 0 exit met (ticket 04 PASS, `.ai/reports/effect-v4-wave0-exit-gate.md`)                                                                       |
| MIG-WAVE1-EXIT              | `diagnostics` typed-error foundation (ticket 05, `dd654dce`) + `persistence` beachhead (ticket 06, `8a789b91`) landed with the full acceptance bar |
| MIG-WIRE-1                  | `PERSISTENCE_*` codes survive as `Data.TaggedError` (`packages/persistence/src/errors.ts`; `errors.test.ts`)                                       |
| MIG-WIRE-4                  | Effect Schema values round-trip through `canonicalSerialize` + envelope/rawHash and reload (`schema-serialization.test.ts`)                        |
| SaveStore API compatibility | public signatures/exports unchanged; compatibility/recovery/corruption suites green                                                                |
| MIG-GATE-1                  | `pnpm --filter @bluewave/persistence test` green; `pnpm check` EXIT 0                                                                              |
| MIG-RB-1                    | rollback point recorded: Wave 0 exit `6cc0e414` is a known-green checkpoint (verified at ticket 04); reverting Wave 1 restores it                  |

## Commands and observed results

```text
pnpm --filter @bluewave/persistence test -> Test Files 8 passed; Tests 64 passed; EXIT 0
pnpm check                               -> EXIT 0 end-to-end (preflight, format, lint, lint:effect, licenses, typecheck, build, test:run, balance-reports, e2e 30 passed)
node scripts/verify-golden-hashes.cjs    -> All 10 hashes match golden reference; EXIT 0
pnpm test:cross-process                  -> {"success":true, ...}; EXIT 0
node scripts/assert-single-effect.mjs    -> ok (no registry effect; workspace:vendor/effect); EXIT 0
```

Both Wave 1 packages are real `workspace:*` consumers of the vendored `effect`:
`@bluewave/diagnostics` (ticket 05) and `@bluewave/persistence` (ticket 06).

## Determinism evidence

- Content artifact hash: `103c60d3f25d1f6ccf758416ef33754732f0f837ad8021d3985ee027d95bccd9`
- Closing snapshot hash: `bdc8d346ad7662be2911ffc839826f25a29eed937218351dd6e15de6a9c0efe5`
- Replay result: `replayVerificationHash 097f9929…`; `"success": true`
- Processes and operating systems used: two child processes, macOS (darwin-arm64), Node per repo engine

Goldens 10/10 unchanged. ADR-0103 note: the determinism gate is deprecated; Wave
1 ran it and reports **unchanged** — no drift.

## Canonical artifact changes

None. The persistence wire shape is frozen and proven byte-identical
(MIG-WIRE-4); existing saves load.

## Tests added

Wave 1 added: `diagnostics` 3 tagged-error tests (ticket 05);
`persistence` `schema-serialization.test.ts` (5) + `errors.test.ts` (4),
including the reviewer-driven non-finite rejection regression (ticket 06).

## Security and cancellation

The save boundary's fail-closed structural validation was restored to exact
Zod-v4 parity (ticket 06 reviewer HIGH: `Schema.Finite`); path-traversal
defenses, atomic tmp→rename→pointer, and abort/rollback are unchanged and
covered by the green suites.

## Performance observations

None material.

## ADRs and dependencies

- ADR-0104 (persistence beachhead). Wave 1 added `effect` to `diagnostics` and
  `persistence`; `zod` removed from `persistence` (still root devDep until Wave 2).

## Known limitations and deferred requirements

- The persistence `throw` + `DiagnosticCollector` mix is intentionally retained
  for this wave (ADR-0104); the tagged vocabulary is preparatory.
- Async Effect `platform` FileSystem IO deferred behind the facade.

## Changed files

- Traceability only: `.scratch/effect-v4-vendor-migration/issues/07-wave1-exit-gate.md`
  (ACs/status/comments), ticket 08 frontier flag, `.ai/SPRINT-PLAN.md`,
  `docs/PROGRESS.md`, this report.

## Git and remote status

- Branch: `dev`
- Commits: see the accompanying `chore(effect): pass the Wave 1 exit gate and record the rollback point` commit
- Working tree: clean after commit
- Push status: not pushed (local sprint; no push requested)
- Pull request: none
- Merge performed: no

## Secondary consistency check

Re-ran the persistence suite and `pnpm check` independently of the ticket-06
reports; confirmed both Wave 1 packages link the vendored `effect`, goldens are
unchanged, and the Wave 0 exit checkpoint (`6cc0e414`) was green.
