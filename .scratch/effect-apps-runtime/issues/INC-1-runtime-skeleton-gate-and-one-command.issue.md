# INC-1 — Runtime skeleton, gate move, and one command end-to-end

**Type:** implementation
**Status:** open
**Blocked by:** None (can start immediately)
**Frontier:** yes

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
