# ADR-0128: The Effect v4 runtime wave is not warranted — facades stay plain, errors stay runtime-free

## Status

Accepted (2026-10-12).

## Context

ADR-0100 adopted the Effect v4 line and set a runtime-usage policy: pure
synchronous packages use only the runtime-free subset (`Schema`/`Data`/`Result`),
the full runtime is permitted only at explicit IO/infrastructure/orchestration
entrypoints, and the renderer imports no Effect at all. Its Wave 5 ("unification
& entrypoints") was planned to flip cross-package facades to Effect-typed
interfaces, introduce one long-lived `ManagedRuntime` in `apps/desktop/src/main`,
and put `apps/compiler-cli` internals behind a `runPromise` facade.

The migration audit (`.scratch/effect-v4-vendor-migration/issues/00-…`, ticket
00 §5-A/§5-B) tested those premises against the code and found them
unsupportable:

- The renderer value-imports `@bluewave/ship-design`, `@bluewave/campaign` and
  `@bluewave/campaign-engine`, transitively reaching `contracts`, `armament`,
  `deterministic`, `persistence`, `diagnostics`, `random`, `content-compiler` and
  `content-schema`. A public surface on any of those packages that exposes an
  Effect type (e.g. a top-level `Data.TaggedError`) is a retained side effect
  that bundles `effect` into the renderer — directly contradicting `MIG-EXCL-1`
  and ADR-0125. This was confirmed by experiment, not assumed (esbuild 0.25.12
  against `vendor/effect`: `~effect/` retained, ≈13.6 KB minified).
- `packages/persistence`'s `SaveStore` is synchronous **by contract** (ADR-0104
  §6); `content-compiler`, `commands`, `ai` and `phase-engine` are synchronous
  pure pipelines. ADR-0100 §2 forbids "blind wrapping of pure functions in
  `Effect`".
- `phase-engine` (8244 LOC) and `ai` (651 LOC) were originally listed as
  IO/orchestration but contain no async, no `node:` import and no IO.
- `apps/desktop/src/main` and `apps/compiler-cli` are synchronous `node:fs`
  pipelines; there is no composable async service graph to justify a runtime.

By the time Wave 4 closed, the substantive adoption was complete: one validator
idiom (Zod → Effect `Schema`), in-process `Data.TaggedError` across the engine's
throw sites, the vendored `effect@4.0.2`, and runtime-free pure packages.

## Decision

1. **Cross-package public facades are not flipped to Effect-typed signatures.**
   They stay plain-TS. A package the renderer can reach must not expose an
   Effect-typed surface (`MIG-EXCL-1`, ADR-0125, ADR-0100 §2), and a synchronous
   pure API must not be wrapped (`ADR-0100 §2`). Typed errors are expressed as
   in-process `Data.TaggedError` **inside** the runtime-free packages and do not
   change their exported signatures.
2. **No `ManagedRuntime` is introduced in `apps/desktop/src/main`.** The main
   process keeps its `whenReady`/`ipcMain` entrypoint and its synchronous
   `node:fs` pipeline. There is no composable async service graph, and routing
   pure deterministic command dispatch through `Effect` would be the blind
   wrapping ADR-0100 §2 forbids; converting the sync filesystem pipeline to an
   async runtime would change behaviour with no present need.
3. **`apps/compiler-cli` keeps its plain entrypoint.** Its internals remain
   synchronous; no `runPromise` facade is added because there is no Effect-typed
   internal surface to hide.
4. **The runtime-free subset remains the whole in-process idiom.** The single
   runtime symbol in the repository stays `Effect.succeed([])` as a decoding
   default in `packages/persistence/src/schemas.ts`.
5. Wave 5 tickets 34–36 are closed as a documented decision (not manufactured
   work); ticket 37's objective acceptance gate still runs to certify the
   migration, and ticket 38 records the final rollback point.

## Consequences

- The renderer/preload bundles are untouched (≈0 delta); the IPC-only UI boundary
  and the Electron sandbox posture are preserved.
- No fiber/clock surface enters the deterministic engine; cross-process hashes
  are unchanged across the migration.
- The monorepo exposes two idioms at the boundary — plain-TS synchronous engines
  and the runtime-free Effect subset — rather than one universal runtime. This is
  the deliberate cost of keeping the renderer bundle clean.
- If a future surface gains genuine async IO/orchestration (and is not
  renderer-reachable), a `ManagedRuntime` may be introduced there under
  ADR-0100's policy; this ADR does not forbid it, it only declines to add one
  where none is warranted today.

## Alternatives considered

- **Flip facades literally.** Rejected: pulls `effect` into the renderer
  (`MIG-EXCL-1`) and/or blind-wraps pure functions (ADR-0100 §2).
- **Introduce a `ManagedRuntime` in `main` for ceremony.** Rejected: no service
  graph to compose; adds fiber surface to a synchronous pipeline for no
  behavioural gain.
- **Convert the sync `node:fs` surfaces to async Effect.** Rejected: a wide,
  high-regression-risk behaviour change (sync → async) with no present need;
  deferred until a caller actually requires the async seam.
