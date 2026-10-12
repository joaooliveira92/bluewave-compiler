# Validation Report: EFFECT-V4 Wave 3 exit gate (ticket 21)

## Outcome

`PASS`

## Scope delivered

Orchestrator-run acceptance of **Wave 3 — Foundation core** for the
`.scratch/effect-v4-vendor-migration/` effort (ticket `21-wave3-exit-gate.md`,
proving MIG-WAVE3-ENTRY, MIG-WAVE3-EXIT, MIG-RB-3, MIG-RUNTIME-1, MIG-RUNTIME-2,
MIG-GATE-TYPE-1, MIG-GATE-UNIT-1). Wave 3 is signed off; tickets 24 and 26 are
the frontier.

## Requirements evidence

| Requirement     | Evidence                                                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| MIG-WAVE3-ENTRY | Wave 2 exit met (ticket 15 PASS, `.ai/reports/effect-v4-wave2-exit-gate.md`)                                                                      |
| MIG-WAVE3-EXIT  | `events` remainder migrated (ticket 20); `contracts`/`deterministic`/`random`/`armament` verified runtime-free and closed not-needed (16–19)      |
| MIG-RUNTIME-1   | No `Effect`/`Layer`/`ManagedRuntime`/`Context`/`Effect.run*` in any pure package; only `persistence/src/schemas.ts:50` (`Effect.succeed` default) |
| MIG-RUNTIME-2   | The random-decision ledger is untouched; `events`/`combat` add no runtime and no fibers                                                           |
| MIG-GATE-TYPE-1 | `pnpm typecheck` clean (37/37); `pnpm lint:effect` 0 errors                                                                                       |
| MIG-GATE-UNIT-1 | `pnpm --filter @bluewave/events test` 5 files / 40 tests; `pnpm check` EXIT 0 (e2e 33 passed)                                                     |
| MIG-RB-3        | rollback point recorded: Wave 2 exit `88de12f9` is the known-green checkpoint; reverting the Wave 3 code delta restores it                        |

## Commands and observed results

```text
pnpm --filter @bluewave/events test     -> 5 files / 40 tests passed; EXIT 0
pnpm typecheck                          -> 37/37
pnpm lint:effect                        -> 0 errors (no events warnings)
pnpm check                              -> EXIT 0 end-to-end; desktop e2e 33 passed
node scripts/assert-single-effect.mjs   -> ok (no registry effect; workspace:vendor/effect)
node apps/desktop/scripts/check-renderer-bundle.mjs
                                        -> renderer bundle clean: no yaml/effect across 20 chunk(s)
```

Runtime audit: `rg` for `Layer`/`ManagedRuntime`/`Context`/`Effect.run*` over
`packages`/`apps` returns only unrelated domain `Layer` enums (air-defense, map
layers). The only `effect` runtime symbol is `Effect.succeed([])` as a decoding
default in `packages/persistence/src/schemas.ts`.

## Determinism evidence

- Content artifact hash: `103c60d3f25d1f6ccf758416ef33754732f0f837ad8021d3985ee027d95bccd9`
- Closing snapshot hash: `bdc8d346ad7662be2911ffc839826f25a29eed937218351dd6e15de6a9c0efe5`
  (identical to the Wave 1/Wave 2 exits — no drift)
- Replay result: `replayVerificationHash 097f9929…`; `"success": true`
- Processes and operating systems used: two child processes, macOS (darwin-arm64), Node per repo engine

Goldens 10/10 unchanged.

## Canonical artifact changes

None. Wave 3 adds in-process tagged errors and migrates remaining plain throws;
the event envelope wire format is unchanged (`MIG-WIRE-3`).

## Tests added

`packages/events/test/errors.test.ts` — asserts `_tag`, `name`, typed fields and
verbatim message text for the four new tagged errors, and that the ledger and
explanation builder actually raise them.

## Pre-existing reds repaired

None in this wave; the three new-game reds repaired before the Wave 2 gate are
tracked in `.scratch/desktop-test-failures/issues/02-new-game-master-detail-regressions.md`.

## Security and cancellation

Unchanged.

## Performance observations

None material.

## ADRs and dependencies

None. Wave 3 adds no dependency: `events` already depended on the vendored
`effect` (ticket 10).

## Known limitations and deferred requirements

- `commands` (ticket 24) and the `combat` residual throws (ticket 26) are the
  Wave 4 frontier; `ai` (29) and `phase-engine` (30, with the ADR-0100 table
  amendment) follow. The IO/runtime wave (34–36) is unchanged.

## Changed files

- Code: `packages/events/src/errors.ts` (new), `ledger.ts`, `explanation.ts`,
  `index.ts`; test `packages/events/test/errors.test.ts` (new).
- Traceability: `.scratch/effect-v4-vendor-migration/issues/{20,21,24,26}.md`,
  `.ai/SPRINT-PLAN.md`, `docs/PROGRESS.md`, this report.

## Git and remote status

- Branch: `dev`
- Commits: `80f60f89` (ticket 20) + the Wave 3 gate commit
- Working tree: clean after commit
- Push status: not pushed (local sprint; no push requested)
- Pull request: none
- Merge performed: no

## Secondary consistency check

Re-ran the events suite, `pnpm typecheck`, the single-copy guard and the
renderer-bundle guard independently of the ticket-20 report; all green. The Wave
2 exit checkpoint `88de12f9` is the rollback point; the ticket-20 commit also
carried a whitespace-only reformat of the Wave 2 gate report, so the Wave 3 code
delta alone is `packages/events/src/**` + `packages/events/test/errors.test.ts`.
