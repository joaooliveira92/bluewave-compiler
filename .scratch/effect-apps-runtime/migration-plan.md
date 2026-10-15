# Migration execution plan — apps to the full Effect runtime

Coordinated migration on branch `feat/effect-apps-runtime` (worktree
`/Users/joao/dev/bluewave-effect-apps`) from base commit `5b96e908`. Tickets are
an execution mechanism, not deliverables. The service graph at `5b96e908` is the
shared foundation; implementators may not redefine it.

## Foundation (already landed at 5b96e908)

`runtime/{contentArtifact,projectStore,campaignSessionStore,commandQueueStore,
sidecarStores,platform,commandProgram,desktopMainLayer}.ts` — services + Layers +
`CommandEnv` + `withSchema`/`withStrictSchema`/`payloadless` program adapters.

## Rules for every ticket

- Work ONLY in `/Users/joao/dev/bluewave-effect-apps` (pass `workdir` to every
  bash call). Never touch `/Users/joao/dev/bluewave-compiler`.
- Do not run `git`; the orchestrator integrates.
- No compatibility shims, dual paths, `liftLegacy`, TODOs, or follow-up tickets.
- Every handler becomes a native `CommandProgram` resolving services from
  `CommandEnv`; typed `CommandError` throughout; no `unknown`/`Error` collapse.
- Each ticket owns the files it lists exclusively.

## Tickets (dependency order)

- **T1 Inspect family** — `commands/inspectCampaign.ts`, `inspectMap.ts`,
  `inspectBattleHistory.ts`, `inspectOpeningBriefing.ts`, `inspectPriorities.ts`.
- **T2 Sidecars** — `uiState.ts`, `monthlyReports.ts`, `drawingBoardDraft.ts`.
- **T3 Queueing core + construction** — `commands/playerCommandSupport.ts`,
  `commandEnvelope.ts`, `constructionCommands.ts`, `constructionStatusCommands.ts`,
  `commands/construction/snapshot-store.ts`.
- **T4 Fleet + design** — `commands/fleetCommands.ts`, `designCommands.ts`.
- **T5 Research + diplomacy + division + budget** — `commands/researchCommands.ts`,
  `diplomacyCommands.ts`, `divisionCommands.ts`, `budgetCommands.ts`.
- **T6 Compile/commit/continuity/session + ReplayService/CrashReporter** —
  `commands/compileCampaign.ts`, `commitMonth.ts`, `commands/commitMonth/**`,
  `continuityCommands.ts`, `sessionCommands.ts`, `campaignSessionMetadata.ts`,
  `monthInput.ts`, `runtime/replayService.ts` (new), `runtime/crashReporter.ts`
  (new), `runtime/desktopMainLayer.ts` (add both to `CommandEnv`).
- **T7 Battle sandbox** — `commands/battleSandboxCommands.ts`.
- **T8 Registry + composition root (orchestrator)** — `campaignBridge.ts`,
  `index.ts`; delete `liftLegacy`, dual registry, all `*Deps`.
- **T9 compiler-cli internals** — `apps/compiler-cli/src/**` (convert the real
  `commands.ts` call graph, not just `main.ts`).
- **T10 Tests** — update every `*.test.ts` to the Effect-native boundaries and
  important failure paths.

T1–T7 unblock immediately; T8 depends on T1–T7; T9 independent; T10 after T8/T9.
Final: full `pnpm check` until green; repository-wide audit; consolidated report.
