# Effect runtime adoption in apps — map

**Type:** map
**Status:** resolved

## Destination

A decision-complete spec hand-off for flipping the two non-renderer app surfaces
(`apps/desktop/src/main` and `apps/compiler-cli`) onto the **full Effect v4
runtime** — a long-lived `ManagedRuntime`, `Context.Service` + `Layer`
composition, and typed error channels — while the renderer/preload stay
Effect-free (`MIG-EXCL-1`) and every golden/hash stays byte-identical. Execution
follows the repo pipeline: this map → `to-spec` → `to-tickets` → implementator.

## Notes

- **Domain:** Bluewave, a deterministic naval campaign engine on `effect@4.0.2`
  (vendored at `vendor/effect`; `repos/effect` is read-only reference). Today the
  repo runs the **runtime-free subset only** (`Schema`/`Data`/`Result`/…); the
  single runtime symbol is `Effect.succeed([])` in `packages/persistence`. The
  full runtime is currently *forbidden* in `apps/desktop/src/main` by
  `scripts/assert-runtime-free.mjs` (`RUNTIME_FREE_ROOTS`, line 37) under
  ADR-0128.
- **This effort reverses ADR-0128 for the app surfaces only.** ADR-0128
  §Revisit trigger #1 ("a non-renderer-reachable async IO seam with a composable
  service graph") and the decision "a deliberate reversal … must update that
  gate's `RUNTIME_FREE_ROOTS` in the same change" are the sanctioned path. Write
  a superseding ADR (next free number is **ADR-0159**) and move the gate together.
- **Hard constraint:** `apps/desktop/src/renderer` and `apps/desktop/src/preload`
  import **no** `effect`. The renderer value-imports `ship-design`/`campaign`/
  `campaign-engine`; any Effect-typed surface there bundles the runtime
  (`MIG-EXCL-1`, ADR-0125/0128). Guarded by `scripts/check-renderer-bundle.mjs`
  and the renderer content-boundary test — both must stay green.
- **Determinism is non-negotiable.** Goldens, cross-process hashes, and
  `pnpm preflight`'s determinism gates stay byte-identical; adopting a runtime in
  the app shells must not move an authoritative hash. The engine packages stay
  runtime-free.
- **Skills per session:** `research` (AFK tickets), `prototype` (04),
  `grilling` + `domain-modeling` (HITL tickets), `effect-best-practices` /
  `agent-patterns/effect-idioms.md` for idioms. Read `repos/effect/LLMS.md` and
  the relevant `repos/effect/packages/*` source before relying on behaviour.
- **Standing preference:** behaviour-preserving, incremental, one vertical slice
  at a time; never a big-bang rewrite. Deferred work is recorded, never silently
  dropped.

## Decisions so far

<!-- the index: one line per closed ticket, enough to judge relevance, then zoom the link for the detail the ticket holds -->

- [Effect v4 runtime idioms for an Electron main process and a sync CLI](issues/01-research-effect-runtime-idioms.md): `ManagedRuntime.make`/`.runPromise`/`.dispose` build-once-in-`whenReady`, dispose in bounded shutdown; bridge at `ipcMain.handle`/CLI `main()` only; **wrap raw `node:fs`** (no `@effect/platform-node`); v4 names pinned (`Context.Service`, `Layer.effect`, `Effect.forkChild`, `runSync`→`Cause.AsyncFiberError`); `@effect/vitest` shares `vitest@5.0.3`; Clock/Random/fiber-scheduling stay off hashed paths. Note: `docs/research/effect-apps-runtime-01-runtime-idioms.md`.
- [IO/service inventory of desktop main and compiler-cli](issues/02-research-app-io-service-inventory.md): proposed services (`ContentArtifactStore`, `ProjectStore`, `CampaignSessionStore`, `CommandQueueStore`, `CommandDispatcher`, + app-shell stores); existing DI seams are the natural boundaries (`*Deps`, `CommandRegistry`, `CrashContext`); **only native dialogs + `whenReady` + devtools import are genuinely async** — everything else sync `node:fs`; **compiler-cli is fully synchronous**. Note: `docs/research/effect-apps-runtime-02-io-service-inventory.md`.
- [Supersede ADR-0128 for the app surfaces](issues/03-grilling-supersede-adr-0128.md): **ADR-0159** accepts the full runtime in `apps/desktop/src/main` + `apps/compiler-cli` only; renderer/preload and `packages/*` unchanged; ADR-0128 marked superseded; `RUNTIME_FREE_ROOTS`/`RULES.md`/gate-doc edits listed for implementation (08); `docs-check` green.
- [Service and layer decomposition of desktop main](issues/04-grilling-service-layer-decomposition.md): `Context.Service` (methods `Effect<A,E,never>`, deps resolved in the Layer); service set = `ContentArtifactStore`, `ProjectStore`, `CampaignSessionStore`, `CommandQueueStore`, `ReplayService`, `CommandDispatcher`, `UiStateStore`, `ReportsStore`, `DraftStore`, `CrashReporter`, `NativeDialog`, `AppPaths`, `Clock`, `BattleSandboxStore`; one `desktopMainLayer` + one `ManagedRuntime` in `whenReady()`; migrate `*Deps` behind adapters then delete.
- [Command-dispatch and error-channel shape](issues/05-grilling-command-dispatch-error-channel.md): handlers become `Effect<A, CommandError, CommandEnv>`; `CommandError` = `Data.TaggedError` union; dispatcher maps `Exit`→`BridgeResult` (byte-identical wire); `UNKNOWN_COMMAND`/`NOT_IMPLEMENTED`/`INVALID_PAYLOAD` + debug seams preserved; byte-identical invariant fixture.
- [compiler-cli adoption shape](issues/06-grilling-compiler-cli-adoption-shape.md): entrypoint facade only (no sync→async conversion); `exitCodes`/`ExitCategory` (0–5) preserved via explicit mapping; CLI-local services extracted per slice; `parseOptions`/output modes stay at the edge.
- [Test and tooling strategy for the runtime surfaces](issues/07-grilling-test-tooling-strategy.md): adopt `@effect/vitest@4.0.2` (shares `vitest@5.0.3`; amends ADR-0100 §1); `it.effect`/`it.live` for runtime programs, `vite-plus/test` elsewhere; test Layers + TestClock; goldens remain authority.
- [Determinism, boundary preservation, and the gate/doc edits](issues/08-task-determinism-boundary-gate-edits.md): renderer/preload Effect-free + authoritative hashes byte-identical + single `effect` copy; `RUNTIME_FREE_ROOTS` drops main; `RULES.md` §Effect + `runtime-free-gate.md` updated; DoD = `pnpm preflight`/`test:scripts`/`check` green.
- [Migration sequencing and the spec hand-off](issues/09-task-migration-sequencing-spec-handoff.md): destination reached — `spec.md` (`ERA-R1..R20`) + eight implementation tickets (`INC-1`..`INC-8`) under `issues/`; `.ai/specs/README.md` pointer added.

## Not yet specified

_(none — the reversal decision cleared the fog; the remaining questions are
sharp enough to ticket, see 04–09.)_

## Out of scope

- Any `effect` import in `apps/desktop/src/renderer` or `apps/desktop/src/preload`
  (`MIG-EXCL-1`, ADR-0125).
- Flipping `packages/*` runtime-free roots to the runtime — they stay pure unless
  a genuine async IO seam appears (ADR-0128 §Revisit #2), which is a separate
  effort.
- Any gameplay, balance, or authoritative-hash change; goldens stay
  byte-identical.
