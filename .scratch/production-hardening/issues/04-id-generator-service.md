# 04: IdGenerator service (remove ambient randomness in app programs)

**What to build:** campaign session identifiers are produced by a service rather than by an inline
`randomUUID()` inside the compile and load command programs. No Effect program reaches for ambient
randomness; the identifier source is an explicit, injectable dependency consistent with the
determinism rules for the app surfaces.

**Blocked by:** 01 — Land the Effect runtime migration on `dev`

**Status:** resolved

- [x] A service in the desktop main runtime provides session-id generation; the compile and load
      programs resolve it from the graph instead of importing a random source directly.
- [x] No production Effect program calls a global random/UUID source directly.
- [x] Behaviour is unchanged from the player's perspective (a fresh, unique id per new/loaded
      campaign); the existing suites stay green.
- [x] Tests can inject a deterministic generator through a test Layer.

## Comments

Added an `IdGenerator` `Context.Service` at the platform edge
(`apps/desktop/src/main/runtime/platform.ts`) — `next: () => Effect.Effect<string>` — with the
production `idGeneratorLayer()` calling `randomUUID()` (the ambient read now lives only in the layer,
exactly as `clockLayer` owns `new Date()`). Registered in `CommandEnv` and merged into
`desktopMainLayer()`.

`compileCampaign.ts` and `continuityCommands.ts` (`loadCampaign`) no longer import `node:crypto`;
each resolves `IdGenerator` from the graph (`yield* ids.next()`) at the same call site the inline
`randomUUID()` occupied, so ordering/lifecycle is unchanged. `sessionId` remains an opaque in-memory
session handle (never hashed/persisted), so there is no determinism or golden impact.

Tests inject the generator through a test Layer: `compileCampaign.test.ts` and
`continuityCommands.test.ts` override `IdGenerator` with a per-call counter and assert the exact
injected id (`test-session-0`, and `test-session-1` for load after compile consumed 0), which a real
`randomUUID()` could not produce.

**Evidence:** `pnpm --filter @bluewave/desktop exec vp test run src/main/commands/compileCampaign.test.ts
src/main/commands/continuityCommands.test.ts` → 2 files / 28 tests pass; `rg randomUUID
apps/desktop/src/main --glob '!*.test.ts'` → only `platform.ts` (the layer); `pnpm typecheck` exit 0;
`pnpm lint` 0/0; `pnpm lint:effect` 0 errors (the new `node:crypto` import is a `node-builtin-import`
warning, consistent with the pre-existing `node:os`/`node:path` imports); `pnpm format` clean;
`pnpm preflight` exit 0.

**Review:** adversarial pass returned APPROVE (no blocker/high). One low finding — the platform file
comment over-claimed "the app's one ambient-randomness seam" while `SaveStore.save` still derives its
own `saveId` from `Date.now()`/`randomUUID()` in `packages/persistence` (a non-Effect package, outside
this ticket's desktop-main scope) — was repaired by scoping the comment to the desktop-main programs.
