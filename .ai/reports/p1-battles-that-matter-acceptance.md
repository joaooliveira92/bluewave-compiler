# Validation Report: P-1 "Battles that matter" acceptance gate

Date: 2026-10-09. Sprint: **P-1 close-out / acceptance gate** (Track P, ADR-0045).
Kind: acceptance gate (IMPLEMENTATION-PROMPT §6 + ORCHESTRATION validation gate).

## Outcome

`PASS`.

P-1 is complete: every AC-1..AC-8 is proven by a passing test, and the full
orchestrator validation gate is green on a clean working tree. The gate also
repaired one pre-existing regression that had left `dev` non-startable (see
"Pre-existing gate repair").

## Scope delivered

P-1 makes the M3 torpedo mechanics change real campaign battle outcomes by
wiring them into `resolveBattleAuto` — the only path a campaign battle takes —
and by authoring research-grounded torpedo armament as compiled design content.

Delivered (tickets 01–12; ticket 05 superseded by 07):

- optional `torpedoArmament` on `DesignTemplateSchema`/compiled designs (AC-1/2);
- as-built 1880-roster torpedo fits authored from research (AC-3);
- `projectBattle` launcher wirings + per-ship torpedo target contexts (AC-4);
- a deterministic torpedo doctrine in `resolveBattleAuto` (AC-5);
- damage control running in every auto-resolved battle (AC-6, ADR-0049);
- campaign reachability from a compiled production-pack battle (AC-7);
- two-process determinism of a torpedo-armed auto-resolved battle (AC-8).

Deferred (recorded in the spec, not dropped): mines in battle areas (needs
DESIGN-25 route strikes, C-2 continuation); deliberate smoke-screen doctrine
(PRE_WAR-era, P-6); post-1900 design torpedo armament research; DESIGN-41 §17
high-speed-loss and §1/§27 persistent damage-control resources; fleet depth
(CONTENT-4).

## Requirements evidence

| AC   | Implementation                                                                                                 | Proving test                                                                                                                     |
| ---- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| AC-1 | `DesignTemplateSchema` optional `torpedoArmament` (closed mount enum, tubes ≥ 1) — `content-schema`            | `packages/content-schema/test/research-design.test.ts` → "P-1 AC-1: accepts torpedoArmament and rejects bad mounts"              |
| AC-2 | Compiled designs carry `torpedoArmament`; unarmed designs keep their hash shape — `campaign/designCompilation` | `packages/campaign/test/campaign.test.ts` → "P-1 AC-2: compiles optional torpedoArmament; unarmed designs keep their hash shape" |
| AC-3 | 1880-roster as-built fits — `content/production/1880/designs.yaml`                                             | `packages/cross-process-test/test/production-pack-loop.test.ts` → "P-1 AC-3: 1880 roster torpedo armament"                       |
| AC-4 | `packages/combat/src/battleResolution/torpedoProjection.ts`, `project.ts`                                      | `packages/combat/test/battle-resolution/torpedo-auto.test.ts` → "P-1 AC-4 projection" (2 tests)                                  |
| AC-5 | `packages/combat/src/battleResolution/resolve.ts` torpedo doctrine                                             | `torpedo-auto.test.ts` → "P-1 AC-5/AC-6 auto-resolution with torpedoes" (3 tests)                                                |
| AC-6 | Damage-control stage runs in every battle (ADR-0049)                                                           | `packages/combat/test/battle-resolution/ac6-damage-control-gate.test.ts` (1 test) + pinned unarmed baselines                     |
| AC-7 | Compiled production-pack battle emits torpedo records + differs from stripped                                  | `production-pack-loop.test.ts` → "P-1 AC-7: torpedoes reachable from a compiled production-pack battle"                          |
| AC-8 | Battle-resolution child runs torpedo-armed battles                                                             | `packages/combat/src/simulation/run-battle-resolution-child.ts` + `packages/cross-process-test/test/cross-process.test.ts`       |

## Commands and observed results

```text
pnpm -w turbo run build --force
  Tasks: 19 successful, 19 total (Cached: 0 cached, 19 total) — exit 0

pnpm typecheck
  Tasks: 35 successful, 35 total — exit 0

pnpm lint
  Found 0 warnings and 0 errors (1733 files, 112 rules) — exit 0

pnpm format
  All matched files use the correct format (1931 files) — exit 0

pnpm test:run
  EXIT=0; all 18 package summaries passed (desktop 194 files / 1302 tests; combat,
  campaign, phase-engine, cross-process-test, ship-design, content-schema, … all green)

node scripts/verify-golden-hashes.cjs
  All 10 hashes match golden reference

pnpm test:cross-process
  {"...","success":true}

pnpm test:e2e
  24 passed (52.8s)

Focused P-1 (packages/combat):
  npx vp test run test/battle-resolution/{torpedo-auto,ac6-damage-control-gate,
  torpedo-foundering,cause-of-loss}.test.ts
  Test Files 4 passed (4) | Tests 15 passed (15)

Focused P-1 (packages/cross-process-test):
  npx vp test run test/production-pack-loop.test.ts
  Test Files 1 passed (1) | Tests 3 passed (3)
```

## Determinism evidence

From `pnpm test:cross-process` (single process, `run-child.js`):

- Content artifact hash: `103c60d3f25d1f6ccf758416ef33754732f0f837ad8021d3985ee027d95bccd9`
- Initial snapshot hash: `16708259cc8018447fbe3c88c2ddfb737a27c3e51e8892c9b5fa112f6be896a5`
- Closing snapshot hash: `bdc8d346ad7662be2911ffc839826f25a29eed937218351dd6e15de6a9c0efe5`
- Command ledger hash: `48fa215feeaea217c0f3906ebf99c3deddb8697eb6090dd6ae3fa84ea3841a20`
- Event ledger hash: `26af2cf3b853a824b98cb33af1d85086748b2848253538f8986e38f014c20ee5`
- Financial ledger hash: `b5b481d9de8ab2d165920cfe61c1d4baa8440b5ca81b90fc41b121fa99fbbf7a`
- Random-decision ledger hash: `cb9e67f9a76ac4c5cc79f85eade020775beaef9053d1f4c0d6ff19eb3100f678`
- Replay result: `097f992919bdcf70707c8e549a43d008a8169aa90ca67245fcc5d0cdee14b711`
- Battle generation hash: `dcdb85c43321b44523b881ccd12623d1689455f060b5d98487850184bbdcb9b6`
- Two-process byte-identical: yes (`cross-process.test.ts` runs the child twice; AC-8 torpedo-armed runs byte-identical)
- Processes and OS used: macOS (darwin), Node v24.18.0, pnpm 11.21.0

Golden hashes: **10/10 unchanged** in this gate (the gate made no authoritative
change; the last P-1 re-pins were recorded per ADR-0007 in the ticket 12 report).

## Canonical artifact changes

None in this gate. No authoritative hash moved; no golden regeneration was
performed. Prior P-1 re-pins (ADR-0047/0049/0050/0051/0052/0053/0072/0073) are
documented in their own reports/ADRs.

## Pre-existing gate repair

At boot, committed `dev` (HEAD `d7b2640`) did **not** satisfy the gate:
`pnpm lint` failed with 5 errors and `pnpm format` failed on 2 files, and
`DossierSlidePanel.test.tsx` failed 4 tests. Cause: commit `84184d9`
("theme-tokenize the Fleet Dispatch console and globe") accidentally deleted the
dossier's nation-name `<h3>` (leaving `aria-labelledby` dangling) and commented
out `<DossierControls>`, while its tests still assert those controls.

Repair (behaviour-preserving, restores the tested contract; no gameplay/authored
change): restored the `<h3>` heading with the `admiralty-ink` token in
`DossierHeader.tsx`, re-enabled `<DossierControls>` in `DossierSlidePanel.tsx`,
and applied the formatter to `FlavorSummary.tsx` and `e2e/theme.spec.ts`.
`DossierSlidePanel.test.tsx` now 16/16; lint 0/0; format clean.

## Tests added

None added by this gate (the AC tests already exist and pass). Repaired existing
assertions were restored to green; none were weakened or removed.

## Security and cancellation

No security boundary, parsing, path, temp-output, or cancellation behavior was
changed by this gate. The repaired JSX removes no validation or trust boundary.

## Performance observations

Not collected; the gate is non-authoritative. `DrawingBoard.test.tsx` (43.8s) and
`DrawingBoard.panels.test.tsx` (45.2s) dominate the desktop suite but are
pre-existing.

## ADRs and dependencies

No new ADRs or dependencies. Existing: ADR-0045 (Track P re-plan + new gate
criterion), ADR-0046..0053, ADR-0072, ADR-0073.

## Known limitations and deferred requirements

- Mines in battle areas remain unwired (DESIGN-25 route strikes, C-2 continuation).
- Smoke-screen doctrine deferred to PRE_WAR era (P-6).
- Post-1900 design torpedo armament not authored (needs 18-in/21-in research).
- Fleet depth: 14 ships in the 1880 pack (CONTENT-4).
- The P-1 spec's campaign-reachability AC uses the compiled production pack in a
  combat-level integration test; the broader monthly-turn end-to-end reachability
  is exercised by the P-2/P-3/P-6 workstreams.

## Changed files

- `apps/desktop/src/renderer/screens/new-game/nation-selection/DossierSlidePanel/DossierHeader.tsx`
  — restore the nation-name heading (gate repair).
- `apps/desktop/src/renderer/screens/new-game/nation-selection/DossierSlidePanel/DossierSlidePanel.tsx`
  — re-enable `DossierControls` (gate repair).
- `apps/desktop/src/renderer/screens/new-game/nation-selection/DossierSlidePanel/FlavorSummary.tsx`
  — format (gate repair).
- `apps/desktop/e2e/theme.spec.ts` — format (gate repair).
- `.ai/reports/p1-battles-that-matter-acceptance.md` (this report).
- `.ai/SPRINT-PLAN.md`, `docs/PROGRESS.md` — traceability.

## Git and remote status

- Branch: `dev`
- Commits: see the close-out commit below (Conventional Commit).
- Working tree: clean after commit.
- Push status: not pushed (no credentials/tooling invoked in this session).
- Pull request: none.
- Merge performed: no.

## Secondary consistency check

- Re-ran `pnpm test:run` to a log after the focused runs: EXIT=0, 18 package
  summaries, all green; the only stderr noise is the deliberate
  failed-shader-link test and React `act()` warnings in the axe audit (both
  expected, pre-existing).
- Golden verify independently reported 10/10 after the full suite.
- `pnpm typecheck` re-run after the JSX repair: 35/35.
- `git status` clean after commit; no conflict markers; `git fetch` showed
  `HEAD` ahead of `origin/dev` by 4 commits before this session's work.
