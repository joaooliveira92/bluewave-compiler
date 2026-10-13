# ADR-0100: Adopt Effect v4

## Status

Accepted (2026-10-11).

## Context

Bluewave has no Effect anywhere: validation is a single root `zod` devDependency
used at a handful of boundaries, and every async/IO path is hand-rolled. Effect
**4.0 became stable on 2026-09-30** (npm `effect@latest` = `4.0.2`) with a
documented LTS policy (bug fixes to at least Sep 2029, security fixes Sep 2029+).
The core `effect` package has **zero runtime dependencies**.

Two earlier RC-era premises no longer hold: the version line is now predictable
(no weekly RC churn), and there is no `msgpackr`/native-build caveat. The
remaining decision is not *whether* to adopt, but *how much Effect each layer
may use*, so the authoritative engine keeps its determinism hygiene and the
renderer bundle does not grow.

This ADR records the version line and the runtime-usage boundary. Vendoring the
artifact is ADR-0101; the validator swap is ADR-0102; the determinism-spine
demotion is ADR-0103.

## Decision

1. **Bluewave adopts the Effect v4 line as its single monorepo idiom**, pinned to
   the exact stable version (`effect@4.0.2`, or the exact stable `4.0.x` at the
   time of a bump) — **never an `rc`**. `@effect/vitest` tracks the same unified
   version. The pin is enforced by the vendored workspace package (ADR-0101).
2. **Runtime-usage policy is a hard architectural boundary.** Pure synchronous
   packages use only the runtime-free subset; the full Effect runtime is
   permitted only at explicit IO/infrastructure/orchestration/entrypoint
   boundaries; the renderer imports no Effect at all.

   | Layer | Adopt | Do **not** add |
   | --- | --- | --- |
   | Pure synchronous computation (`combat` math, `ship-design`, `ship-visual`, `campaign` derivations, `campaign-engine` (renderer-reachable), `random`, `deterministic`, `contracts`, `armament`, `events` validation, `commands`, `ai`, `phase-engine`, `content-schema`, `diagnostics`) | Runtime-free subset: `Schema`/`SchemaIssue` (sync decode/encode/format), `Data`/`Data.TaggedError`, `Result`, `Option`, `Predicate`, `Equal`/`Hash` | `Effect`/`Layer`/`ManagedRuntime`, fibers, live services |
   | IO / async / orchestration (`persistence`, desktop `src/main`, `compiler-cli`, `content-compiler`) | Full Effect: `Effect`, `Layer`, `Context.Service`, `ManagedRuntime`, cancellation via `Scope`, typed `Cause` | Blind wrapping of pure functions in `Effect` |
   | React renderer (`apps/desktop/src/renderer/**`) | Nothing — talks over IPC | Any Effect import |

   **Amendment (2026-10-12).** The table above reflects the migration audit
   (ticket 00). `ai` (651 LOC) and `phase-engine` (8244 LOC) were originally
   listed as IO/orchestration but contain no async, no `node:` import and no IO —
   they are synchronous deterministic pipelines, so wrapping them in
   `Layer`/`Context.Service` would be the blind wrapping this ADR forbids; both
   moved to the runtime-free row. `content-compiler` was in no row despite being
   filesystem-bound (`stages/parse.ts`, `fullSurface.ts`, `artifact.ts`,
   `shipBuildingDiscovery.ts`) and is now listed as an IO package.
   `commands`/`content-schema`/`diagnostics` were added to the runtime-free row
   (`Data`/`Schema` only). `campaign` remains a pure-derivation package; the
   amendment-time policy debt — its `campaignInput.ts` performed a filesystem read
   inside an otherwise pure package — was resolved by CAH-LEG-1 (commit
   `37ca7384`), which moved the raw-file/parse boundary to the `content-compiler`
   IO package, so `campaignInput.ts` now owns only the coercion contract and the
   package is genuinely IO-free.

3. **The runtime is introduced where an effect is run**, not inside pure
   derivations. In-process domain errors are `Data.TaggedError`; serializable/wire
   errors are `Schema.TaggedError`.
4. **The deterministic named hierarchical random streams remain the RNG
   authority.** Effect's `Random` is a primitive, not a replacement for the
   deterministic ledger; the `random` package's PRNG is not swapped for Effect
   `Random` (ADR-0103).
5. **Out of scope for adoption:** renderer `effect-atom`/Effect-React; any Effect
   in the sandboxed preload; satellite `@effect/platform-*`/`sql-*`/`atom-*`
   packages.

## Consequences

- One validator, one error model, and one runtime idiom across the engine; the
  runtime-free subset keeps pure packages cheap and deterministic.
- The renderer and preload bundles are untouched (≈0 delta), preserving the
  Electron sandbox and IPC-only UI boundary.
- The migration is wave-gated (Wave 0 toolchain/vendor → Wave 5 entrypoints), so
  no package changes runtime behaviour ahead of its wave.

## Alternatives considered

- **Stay on Zod and hand-rolled async.** Rejected: keeps two idioms, no typed
  `Cause`/`Scope`, and no single runtime seam.
- **Adopt v3 stable now, migrate to v4 later.** Rejected: it pays a v3→v4
  migration tax for a destination that is already stable, and v4 is ESM-only
  matching the repo toolchain.
- **Adopt an early v4 RC.** Rejected: stable `4.0.2` shipped 2026-09-30; an RC
  pin buys nothing and risks API churn.
- **Permit the full runtime everywhere.** Rejected: needless fiber/clock surface
  in pure hot loops and a larger renderer/main blast radius.
