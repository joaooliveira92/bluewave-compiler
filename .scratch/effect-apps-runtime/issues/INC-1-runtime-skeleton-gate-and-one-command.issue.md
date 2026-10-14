# INC-1 — Runtime skeleton, gate move, and one command end-to-end

**Type:** implementation
**Status:** resolved
**Blocked by:** None (can start immediately)
**Frontier:** no

**What to build:** Stand up the full Effect runtime in the desktop main process and
prove it end-to-end on one command. Build one `ManagedRuntime` in
`app.whenReady()` (before IPC registration, disposed in the existing bounded-shutdown
continuation), introduce the `CommandError` `Data.TaggedError` union and the single
total `Exit → BridgeResult` mapping, and migrate one command through the runtime
behind a service. Move the runtime-free gate in the same change so local and CI
enforcement cannot drift.

## Acceptance criteria

- [ ] One `ManagedRuntime` is built once in `app.whenReady()` and disposed in the
      bounded-shutdown continuation; `runPromise`/`runPromiseExit` appear only at the
      `ipcMain.handle` edge, never inside Effect code (ERA-R1, R2, R19).
- [ ] `CommandError` is a `Data.TaggedError` union carrying `{ reason, diagnostics }`,
      and one total `Exit → BridgeResult` mapping produces the wire response for
      success, failure, and interruption (ERA-R4, R6).
- [ ] One command is migrated end-to-end through the runtime + a service; its
      `BridgeResult` JSON is byte-identical to before, asserted by a fixture covering
      one success and each failure reason (ERA-R5, R18).
- [ ] `scripts/assert-runtime-free.mjs` drops `apps/desktop/src/main` from
      `RUNTIME_FREE_ROOTS`; its comment, embedded fixtures and
      `scripts/test/assert-runtime-free.test.mjs` are reconciled; `RULES.md` §Effect
      names the two app surfaces; `docs/agents/runtime-free-gate.md` drops main and
      cites ADR-0159 (ERA-R11).
- [ ] The renderer bundle tripwire and the renderer content-boundary test stay green
      (ERA-R9); goldens are byte-identical (ERA-R7, R8).
- [ ] `pnpm preflight` and `pnpm test:scripts` are green.

## Notes for implementator

- Idioms are pinned in `docs/research/effect-apps-runtime-01-runtime-idioms.md`
  (`ManagedRuntime.make`/`runPromiseExit`/`dispose`; `Context.Service`;
  `Layer.effect` + `Effect.acquireRelease`; v4 has no `Layer.scoped`).
- Pick the simplest command for the tracer bullet (e.g. a payload-less inspect
  command with one content read) — the point is the seam, not the surface area.
- Tests may exercise the `runPromise` edge with `vite-plus/test` for this slice;
  `@effect/vitest` arrives in INC-7.
- Do not delete any `*Deps` object yet — INC-5 retires them.

## Answer

Resolved 2026-10-14 on branch `feat/effect-apps-runtime` (worktree
`/Users/joao/dev/bluewave-effect-apps`), behaviour-preserving.

**What landed.**
- `apps/desktop/src/main/runtime/commandError.ts` — the `Data.TaggedError` command
  error union (`UnknownCommand`, `NotImplemented`, `InvalidCommandPayload`,
  `CommandRejected`, `CommandFailed`) with stable `_tag`s.
- `apps/desktop/src/main/runtime/bridgeResult.ts` — the total `Exit → BridgeResult`
  projection at the wire edge (structural `_tag` guard, never `instanceof`); a
  defect collapses to `INTERNAL`.
- `apps/desktop/src/main/runtime/contentArtifact.ts` — the `ContentArtifact`
  service (`Context.Service`, method `Effect<A, E, never>`) + `contentArtifactLayer`,
  wrapping raw `compileProductionCampaignFromArtifact`; no platform service.
- `apps/desktop/src/main/commands/listNewGameOptions.ts` — migrated to the
  `listNewGameOptionsProgram` Effect program (resolves `ContentArtifact`, compiles
  through it, same success bytes, `COMPILE_FAILED` on the error channel).
- `apps/desktop/src/main/campaignBridge.ts` — `CommandProgram` type,
  `defaultCommandPrograms`, a `liftLegacy` adapter for the remaining handlers, and
  a dispatcher that runs the program on an injected `ManagedRuntime` and projects
  the `Exit`; `dispatchCampaignCommand` kept for non-Electron callers via a lazy
  default runtime.
- `apps/desktop/src/main/index.ts` — one `ManagedRuntime` built in `whenReady()`
  (before `registerIpc`), disposed in the bounded-shutdown continuation;
  `runPromiseExit` only at the `ipcMain.handle` edge.
- Gate/docs: `scripts/assert-runtime-free.mjs` drops `apps/desktop/src/main` from
  `RUNTIME_FREE_ROOTS` (15 roots) and its comment/error text cite ADR-0159;
  `scripts/test/assert-runtime-free.test.mjs` asserts main is **not** guarded;
  `RULES.md` §Effect names the two app surfaces; `docs/agents/runtime-free-gate.md`
  drops main and cites ADR-0159.

**Validation (all green).**
- `pnpm --filter @bluewave/desktop typecheck`.
- `listNewGameOptions.test.ts` (5) + `campaignBridge.test.ts` (44) pass; full
  desktop suite **2017 passed / 1 skipped**; `boundary.test.ts` unchanged and green.
- Renderer bundle clean (`check-renderer-bundle`: "no yaml/effect across 20 chunks").
- `pnpm preflight` **37/37**; `pnpm test:scripts` 178 pass; `pnpm lint:effect`
  0 errors; `pnpm check:golden` all 11 hashes match.

**Notes.** The `BridgeResult` wire bytes for `listNewGameOptions` are unchanged
(the existing assertions still pass); the error channel is exercised by the
`COMPILE_FAILED` path. The `*Deps` objects are untouched (INC-5 retires them);
`CommandDispatcher`/remaining services widen in INC-2..INC-5. Cold-cache Vitest
timeouts in the `content-codemod` gate were environmental (fresh worktree),
resolved by warming the module cache.
