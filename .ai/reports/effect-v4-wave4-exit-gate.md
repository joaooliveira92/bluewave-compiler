# Validation Report: EFFECT-V4 Wave 4 exit gate (ticket 33)

## Outcome

`PASS`

## Scope delivered

Orchestrator-run acceptance of **Wave 4 — Domain core** for the
`.scratch/effect-v4-vendor-migration/` effort (ticket `33-wave4-exit-gate.md`,
proving MIG-WAVE4-ENTRY, MIG-WAVE4-EXIT, MIG-RB-4, MIG-RUNTIME-1, MIG-GATE-1).
Wave 4 is signed off; tickets 34–38 (Wave 5) are the frontier.

## Requirements evidence

| Requirement     | Evidence                                                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| MIG-WAVE4-ENTRY | Wave 3 exit met (ticket 21 PASS, `.ai/reports/effect-v4-wave3-exit-gate.md`)                                                                      |
| MIG-WAVE4-EXIT  | `commands` (24, `e5bb77f1`), `combat` residual (26, `2e668e99`), `ai` (29, `ca0ea1d2`), `phase-engine` (30, `a2cc02eb`) migrated; `campaign`/`ship-design`/`campaign-engine` closed not-needed (22/23/25, renderer-reachable per MIG-EXCL-1) |
| MIG-RUNTIME-1   | No `Layer`/`ManagedRuntime`/`Context`/`Effect.run*` in any migrated package; each conversion imports only `{ Data } from "effect"` (runtime-free) except `persistence/src/schemas.ts:50` (`Effect.succeed` decoding default) |
| MIG-EXCL-1      | Renderer bundle guard clean on a fresh build (20 chunks); `~effect/` marker present, 0 hits                                                     |
| MIG-GATE-1      | `pnpm check` EXIT 0 end-to-end; single-copy guard ok                                                                                              |
| MIG-RB-4        | rollback point recorded: Wave 3 exit `0f2cd986` is the known-green checkpoint; reverting the Wave 4 code delta restores it                        |

## Commands and observed results

```text
pnpm check                              -> EXIT 0 end-to-end; desktop e2e 33 passed
pnpm --filter @bluewave/commands test   -> 2 files / 29 tests passed
pnpm --filter @bluewave/combat test     -> 288 files / 3799 tests passed
pnpm --filter @bluewave/ai test         -> 4 files / 37 tests passed
pnpm --filter @bluewave/phase-engine test -> 32 files / 314 tests passed
pnpm typecheck                          -> 37/37
pnpm lint:effect                        -> 0 errors (278 pre-existing warnings)
node scripts/assert-single-effect.mjs   -> ok (no registry effect; workspace:vendor/effect)
node apps/desktop/scripts/check-renderer-bundle.mjs
                                        -> renderer bundle clean: no yaml/effect across 20 chunk(s)
node scripts/docs-check.cjs             -> ok (126 ADRs indexed)
pnpm test:cross-process                 -> success:true (hashes below)
```

Runtime audit: every Wave 4 package imports only `{ Data }` from `effect`.
`rg` for `Layer`/`ManagedRuntime`/`Context`/`Effect.run*` over the four packages
returns only unrelated domain identifiers.

## Determinism evidence

Cross-process run (`pnpm test:cross-process`, two child processes, macOS
darwin-arm64) — identical to the Wave 3 exit, so no hash surface moved:

- Content artifact hash: `103c60d3f25d1f6ccf758416ef33754732f0f837ad8021d3985ee027d95bccd9`
- Closing snapshot hash: `bdc8d346ad7662be2911ffc839826f25a29eed937218351dd6e15de6a9c0efe5`
- Replay result hash: `097f992919bdcf70707c8e549a43d008a8169aa90ca67245fcc5d0cdee14b711`
- `"success": true`

## Canonical artifact changes

None. Wave 4 replaces plain `Error`/`Object.assign(new Error, { code })` throws
with in-process `Data.TaggedError`s carrying byte-identical `message`/`code`
text; no wire, hash or ordering surface changed (`MIG-DET-1`).

## Tests added

- `packages/combat/test/air-combat/records.test.ts` (+2)
- `packages/commands/test/errors.test.ts` (+4)
- `packages/ai/test/errors.test.ts` (+13)
- `packages/phase-engine/test/errors.test.ts` (+5)

## ADRs

`docs/adr/ADR-0100-adopt-effect-v4.md` §2 runtime-usage table amended (ticket 30):
`ai`/`phase-engine` moved to the runtime-free row, `content-compiler` added to
the IO row, `commands`/`content-schema`/`diagnostics` added to the runtime-free
row, `campaignInput.ts`'s filesystem read acknowledged. No new dependency beyond
the vendored `effect` workspace link added to the four packages.

## Known limitations and deferred requirements

- Wave 5 (tickets 34–38: persistence/content-compiler facades, desktop
  `ManagedRuntime`, compiler-cli entrypoint, final acceptance) is the frontier.
- Deferred per ticket 00 §6: `BluewaveError`/`ship-design`/`campaign` error
  classes, hand-rolled reason-code validators, the persistence async facade, and
  the `campaignInput.ts` policy question.

## Changed files

- Code: `packages/{combat,commands,ai,phase-engine}/src/errors.ts` (new) plus
  their converted modules and `index.ts`; four new `test/errors.test.ts` (+ the
  combat records test).
- Traceability: `.scratch/effect-v4-vendor-migration/issues/{24,26,29,30,33}.md`,
  `docs/adr/ADR-0100-adopt-effect-v4.md`, this report.

## Git and remote status

- Branch: `dev`
- Commits: `2e668e99` (26), `e5bb77f1` (24), `ca0ea1d2` (29), `a2cc02eb` (30) + the Wave 4 gate commit
- Working tree: clean after commit
- Push status: not pushed (local sprint; no push requested)
- Pull request: none; merge performed: no

## Secondary consistency check

Re-ran the four focused package suites, `pnpm typecheck`, the single-copy guard
and the renderer-bundle guard independently of the implementation reports; all
green. Rollback point Wave 3 exit `0f2cd986`; the Wave 4 code delta is
`packages/{combat,commands,ai,phase-engine}/src/**` plus the AI/phase-engine
`package.json` dependency lines and the new tests.
