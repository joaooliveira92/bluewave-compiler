# Validation Report: EFFECT-V4 Wave 2 exit gate (ticket 15)

## Outcome

`PASS`

## Scope delivered

Orchestrator-run acceptance of **Wave 2 — Validation boundaries** for the
`.scratch/effect-v4-vendor-migration/` effort (ticket `15-wave2-exit-gate.md`,
proving MIG-WAVE2-ENTRY, MIG-WAVE2-EXIT, MIG-RB-2, MIG-WIRE-2, MIG-WIRE-3,
MIG-ZOD-1..3, MIG-GATE-1). Wave 2 is signed off; ticket 20 (Wave 3 — `events`
remainder) is the frontier.

## Requirements evidence

| Requirement    | Evidence                                                                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| MIG-WAVE2-ENTRY | Wave 1 exit met (ticket 07 PASS, `.ai/reports/effect-v4-wave1-exit-gate.md`)                                                                                |
| MIG-WAVE2-EXIT  | Every plan.md §4.1 boundary on Effect Schema (tickets 08–13); parity suites green; wire parity green                                                          |
| MIG-ZOD-1       | No boundary keeps both: `rg "from ['\"]zod"` over `apps`, `packages`, `scripts` → zero                                                                       |
| MIG-ZOD-2       | ticket 00 §2 classified 08–13 against the code; all six boundaries on `Schema`                                                                              |
| MIG-ZOD-3       | `rg '"zod"'` in any workspace `package.json` → zero; `pnpm why zod` empty; `pnpm install --frozen-lockfile` green                                            |
| MIG-WIRE-2      | `content-schema` / `content-compiler` fixture accept/reject parity suites green (`test:run` EXIT 0)                                                          |
| MIG-WIRE-3      | Desktop IPC envelope + `@bluewave/events` envelope serialization suites green (`test:run` EXIT 0)                                                            |
| MIG-GATE-1      | `pnpm check` EXIT 0 end-to-end; desktop e2e **33 passed**                                                                                                    |
| MIG-RB-2        | rollback point recorded: Wave 1 exit `8c4f7199` is a known-green checkpoint; reverting the Wave 2 commits restores it (Zod returns only with the whole wave) |

## Commands and observed results

```text
pnpm check                               -> EXIT 0 end-to-end (preflight, format, lint,
                                            lint:effect, test:scripts, licenses, typecheck
                                            37/37, build 20/20, test:run, balance-reports,
                                            e2e 33 passed)
pnpm why zod                             -> (empty)
node scripts/verify-golden-hashes.cjs    -> All 10 hashes match golden reference; EXIT 0
pnpm test:cross-process                  -> {"success":true, ...}; EXIT 0
node apps/desktop/scripts/check-renderer-bundle.mjs -> renderer bundle clean: no yaml/effect across 20 chunk(s)
```

Wave 2 boundaries and their commits: 08/09 `d51eada3`, 10 `6f3c007d`, 11
`b2abb4b8`, 12 `5df46569` (hardened `652da67e`/`248cd6ed`), 13 `0c7370d4`, 14
`0f67bedd`.

## Determinism evidence

- Content artifact hash: `103c60d3f25d1f6ccf758416ef33754732f0f837ad8021d3985ee027d95bccd9`
- Closing snapshot hash: `bdc8d346ad7662be2911ffc839826f25a29eed937218351dd6e15de6a9c0efe5`
  (identical to the Wave 1 exit report — no drift)
- Replay result: `replayVerificationHash 097f9929…`; `"success": true`
- Processes and operating systems used: two child processes, macOS (darwin-arm64), Node per repo engine

Goldens 10/10 unchanged.

## Canonical artifact changes

None. Wave 2 is a validation-boundary migration: the content pack, save shape,
IPC/event envelope and canonical hashes are unchanged and proven byte-identical.

## Tests added

Wave 2 added per-boundary parity tests (Zod-vs-Schema accept/reject) in
`content-schema`, `content-compiler`, `events`, `campaign-engine`, `combat` and
desktop `src/main`, plus the ticket-12 non-finite/`SafeInt` hardening regression.

## Pre-existing reds repaired (not part of Wave 2)

Three failures on `dev` left `pnpm check` red and blocked this gate. All traced
to `6dbe595d` (archetype + fleet-method deck commit) and repaired under
`.scratch/desktop-test-failures/issues/02-new-game-master-detail-regressions.md`:

- `RulesOfTheNavalAgeScreen.test.tsx` — `6dbe595d` regressed the Rules screen
  from the ADR-0127 single-press "apply the previewed preset on Next" to a
  two-press "Select" flow without updating its test. Restored to single-press
  (ADR-0127, `naval-age-master-detail` spec); the test passed **unmodified**.
- `e2e/new-game-fleet-method.spec.ts` — the rewritten spec centre-clicked a
  non-top deck card, which the overlapping shared `CardDeck` intercepts. Switched
  to the keyboard path (arrow + Enter) the archetype flow already uses.
- `e2e/theme.spec.ts` — `6dbe595d` dropped `bg-admiralty-surface` from
  `GlobePanel`; restored it so the `globe-panel` frame follows the active theme.

No gate or fixture was weakened.

## Security and cancellation

Unchanged: the save boundary stays fail-closed with `Schema.Finite` parity,
path-traversal defenses, atomic tmp→rename→pointer, and abort/rollback are
covered by the green suites. The renderer-bundle guard (`~effect/` marker) now
also catches a minified `effect` leak.

## Performance observations

None material.

## ADRs and dependencies

- ADR-0105 (strict content-schema decode policy). Wave 2 removed `zod` from
  `content-schema`/`content-compiler`/`events`/`campaign-engine`/`combat`/desktop
  `main` and from every `package.json` (ticket 14).

## Known limitations and deferred requirements

- `persistence` async Effect IO facade and the remaining domain error-class
  migrations are Wave 3–5 work (tickets 20–36), per ticket 00 §6.
- The three repaired new-game reds are outside the Effect migration; they are
  tracked separately in `.scratch/desktop-test-failures/`.

## Changed files

- Code: `apps/desktop/src/renderer/screens/new-game/RulesOfTheNavalAgeScreen.tsx`,
  `apps/desktop/src/renderer/screens/new-game/nation-selection/GlobePanel.tsx`,
  `apps/desktop/e2e/new-game-fleet-method.spec.ts`.
- Traceability: `.scratch/effect-v4-vendor-migration/issues/15-wave2-exit-gate.md`,
  ticket 20 frontier flag, `.scratch/desktop-test-failures/issues/02-…md`,
  `.ai/SPRINT-PLAN.md`, `docs/PROGRESS.md`, this report.

## Git and remote status

- Branch: `dev`
- Commits: the regression repair + the Wave 2 gate commit
- Working tree: clean after commit
- Push status: not pushed (local sprint; no push requested)
- Pull request: none
- Merge performed: no

## Secondary consistency check

Re-ran the desktop e2e suite, goldens and the two-process determinism child
independently of the ticket-14 report; confirmed `pnpm why zod` is empty, the
renderer bundle carries no `effect`, and the Wave 1 exit checkpoint
(`8c4f7199`) was green.
