# Research: Effect v4 — Runtime Determinism Profile

Research-only note; no code, content, or spec files modified. Resolves
`.scratch/effect-v4-adoption/issues/04-runtime-determinism-profile.md` (map:
"Effect v4 Adoption") and grounds the engine-core policy ticket (05) against
primary sources. **Version context (verified 2026-08-16):** Effect v4 is at
Release Candidate — npm dist-tags `latest: 3.22.1` (v3 still npm-latest),
`rc: 4.0.0-rc.109`; v4 `main` branch carries the v4 line, v3 lives on the `v3`
branch; stable v4 targeted Q3/Q4 2026 (see sibling note
`docs/research/effect-v4-release-reality.md`). All "probe" citations below ran
against the published **`effect@4.0.0-rc.109`** tarball (the RC head as of
2026-08-14) on Node v24.18.0, unless the cited source is the v4 `main` branch.

**Headline findings**

1. **Pure/erasable vs runtime-bound is a clean seam.** `Schema` (sync decode
   exists), `Data`, `Option`, `Result` (v4's rename of `Either`), `Predicate`,
   `Cause`/`Exit` as data structures, `Equal`/`Hash`, `Chunk`/`HashMap`/
   `HashSet` are runtime-free: they are values/derivations, no fibers, no
   services. `Effect` is a lazy immutable **data structure** describing a
   program; only the *runtime system* (`Effect.run*`) executes it — that
   execution pulls in fibers, the `Clock`, `Random`, `Console`,
   `ConfigProvider`, `Tracer` default services, and the `Scheduler`.
2. **`Random` is seedable and reproducible, but only explicitly.** The default
   `Random` service is **`Math.random`-based and non-reproducible** (docs:
   "varies each run"; source: `internal/random.ts` default reference).
   `Random.withSeed(seed)` (v4) installs a deterministic **ISAAC CSPRNG**
   seeded from the string/number seed; same seed ⇒ same sequence. Verified on
   rc.109: `withSeed("myseed")` reproduces the official doc example value
   `0.10428056576185751` exactly; a fresh Node process re-running the same
   seeded program emits byte-identical output. v3's deterministic path was
   `Random.make(seed)` (PCG-based); **neither v3 nor v4 exposes a global
   `Random.setSeed`** — seeding is per-effect-scope, and the PRNG algorithm
   changed across the v3→v4 line, so sequences are only stable for a **pinned
   version**.
3. **`Clock` is controllable.** Live default = wall clock (`Date.now()` for
   millis; `performance.now()`-based nanos). `TestClock` (`effect/testing`,
   provided via `TestClock.layer()`) starts at `0`, and `adjust`/`setTime` run
   all scheduled effects "in order"; `sleep` semantically blocks until the
   clock passes the wake time (must fork then adjust — documented gotcha).
   Verified on rc.109: `[0, 300000]` after a 5-minute `adjust`.
4. **Concurrency is cooperative and single-threaded, but no cross-OS/cross-
   process determinism is documented.** Fibers run on one JS thread; the
   scheduler dispatches queued tasks by priority (FIFO within priority) and
   fibers yield at an op budget (default `MaxOpsBeforeYield = 2048`). Parallel
   collections return results in input order, but execution interleaving is
   **not a documented contract**. Empirical probe: a program combining seeded
   draws + `concurrency: "unbounded"` + TestClock + fork/join produced
   byte-identical JSON across **three fresh Node processes** (both `runSync`
   and `runPromise` paths agree). Absence of any documented cross-OS/cross-
   process guarantee is itself a finding: Effect's docs promise nothing about
   determinism of the runtime; the defaults are explicitly nondeterministic.
5. **Nondeterminism traps are concrete and verifiable.** (a) default `Random`
   = `Math.random`; (b) live `Clock` = wall clock, and `Effect.timeout` is
   implemented as `raceFirst(self, sleep(duration))` — winner depends on
   timing; (c) **fiber IDs are a module-global counter that does not reset
   between runs in the same process** (verified: an interrupted fiber appears
   as `fiberId: 1` in run 1 and `fiberId: 2` in run 2 of the same process) —
   `Cause`/`Exit`/logs that carry fiber IDs are therefore not reproducible
   within a process; (d) `HashSet`/`HashMap` are documented **unordered**
   (HAMT hash-layout iteration — deterministic for identical values+version
   but not a contract); (e) `Promise` interop breaks `runSync`
   (`AsyncFiberError`) and ties outcomes to host event-loop timing; (f)
   `Fiber.race`/`raceFirst`/`raceAll`/`timeout` are winner-takes-timing.

---

## 1. Question

Which parts of Effect v4 are pure/erasable and runtime-free (Schema, Data,
structured errors, Cause, Either/Result, Option) versus runtime-bound
(Effect/Fibers/Clock/Random/Scheduler)? Is Effect's `Random` seeded and
reproducible (e.g. `Random.setSeed` / seeded `Random` from a known seed)? Is
`Clock` controllable (`TestClock` / `Clock.currentTimeMillis`)? Does Effect's
concurrency model (fibers, async scheduling) produce deterministic results for
a fixed seed and single-threaded execution — and what are the *documented*
guarantees/caveats about determinism across OSes and process boundaries? How
does one keep an Effect-based computation deterministic (seeded random,
TestClock, runSync vs runPromise, avoiding `Promise` interop)? Which
nondeterminism traps must a deterministic engine (DESIGN-08: identical
content+commands+seeds ⇒ identical authoritative hashes across OSes, named
hierarchical RNG streams, cross-process child-process harness) avoid?

## 2. Sources

| Source | What it is | Verified |
| --- | --- | --- |
| https://effect.website/docs/v4 — official v4 docs hub (sidebar "v4 (rc)") | Docs versioning: v4 docs live under `/docs/v4` | ✅ read |
| https://effect.website/docs/v4/runtime — "Introduction to Runtime" | Runtime system responsibilities; `Effect` is a data structure; default services; `run*` functions | ✅ read in full |
| https://effect.website/docs/v4/getting-started/running-effects — "Running Effects" | `runSync` (throws `AsyncFiberError` on async), `runSyncExit` (Die on async), `runPromise`, `runFork`; best practices | ✅ read in full |
| https://effect.website/docs/v4/requirements-management/default-services — "Default Services" | Live defaults: Clock, ConfigProvider, Console, Random, Tracer; `Random.withSeed` "installs a deterministic random-number generator"; default Random output "varies each run"; doc example `withSeed("myseed")` ⇒ `0.10428056576185751` | ✅ read in full |
| https://effect.website/docs/v4/concurrency/basic-concurrency — "Basic Concurrency" | Concurrency options (sequential/numbered/unbounded); fibers; interruption; `race`/`raceAll`/`raceFirst` semantics ("first to complete wins") | ✅ read in full |
| https://effect.website/docs/v4/testing/testclock — "TestClock" | TestClock = controllable clock; `adjust`/`setTime` run scheduled effects; starts at 0; fork-then-adjust pattern | ✅ read |
| https://effect.website/docs/v4/data-types/hash-set — "HashSet" | HashSet/HashMap documented as **unordered** collections; iteration order not a contract | ✅ read |
| https://raw.githubusercontent.com/Effect-TS/effect/main/packages/effect/src/Random.ts | v4 `Random` module source: service shape (`nextIntUnsafe`/`nextDoubleUnsafe`), `withSeed` ⇒ `ISAAC_CSPRNG(seed)`, doc examples with pinned output values, `crypto.getRandomValues` only when seed omitted | ✅ read in full |
| https://raw.githubusercontent.com/Effect-TS/effect/main/packages/effect/src/internal/random.ts | v4 default `Random` reference: `Math.random`-based `nextIntUnsafe`/`nextDoubleUnsafe` | ✅ read in full |
| https://raw.githubusercontent.com/Effect-TS/effect/main/packages/effect/src/Clock.ts | v4 `Clock` service interface (`currentTimeMillis`, `currentTimeNanos`, `monotonicTimeNanos`, `sleep`) + wall-clock gotchas | ✅ read |
| https://raw.githubusercontent.com/Effect-TS/effect/main/packages/effect/src/internal/core.ts | v4 runtime core: live `ClockRef` (`currentTimeMillisUnsafe()` = `Date.now()`; nanos via `performance.now()`); runSync `AsyncFiberError` | ✅ read (relevant sections) |
| https://raw.githubusercontent.com/Effect-TS/effect/main/packages/effect/src/internal/effect.ts | v4 runtime: `runForkWith`/`runPromise*`/`runSync*` implementations; `runSyncExitWith` uses `MixedScheduler("sync")` + synchronous `fiber._dispatcher.flush()`; `timeout = raceFirst(self, sleep(duration))`; fiber op counter | ✅ read (relevant sections) |
| https://raw.githubusercontent.com/Effect-TS/effect/main/packages/effect/src/Scheduler.ts | v4 `Scheduler` service: `executionMode` "sync"/"async", `shouldYield`, `SchedulerDispatcher` (`scheduleTask` priority + FIFO, `flush()` "deterministic completion"); `MixedScheduler` default async via `setImmediate` (fallback `setTimeout`), sync mode via microtask; `MaxOpsBeforeYield` = 2048; `PreventSchedulerYield` | ✅ read |
| https://raw.githubusercontent.com/Effect-TS/effect/main/packages/effect/src/testing/TestClock.ts | v4 TestClock source: `adjust`/`setTime` run scheduled effects in order; `withLive`; warning when time is used but not advanced | ✅ read |
| https://raw.githubusercontent.com/Effect-TS/effect/main/packages/effect/src/testing/index.ts | v4 `effect/testing` exports: FastCheck, TestClock, TestConsole, TestSchema — **no TestRandom** | ✅ read |
| https://raw.githubusercontent.com/Effect-TS/effect/main/packages/effect/src/internal/hashSet.ts , …/internal/hashMap.ts | v4 HAMT implementations (bitmap-indexed trie; iteration follows hash layout) | ✅ read (structure) |
| https://raw.githubusercontent.com/Effect-TS/effect/v3/packages/effect/src/Random.ts | v3 branch Random API: `make(seed)`/`fixed(values)` exist; no global `setSeed` in v3 either | ✅ read (API surface) |
| https://github.com/Effect-TS/effect/blob/main/MIGRATION.md | Official v3→v4 migration guide (API renames; runtime rewrite) | ✅ read (via ticket-01 note + search) |
| **Local probes** against published `effect@4.0.0-rc.109` tarball (Node v24.18.0): (1) `withSeed` same-seed determinism across two `runPromise` runs; (2) default Random differs across runs; (3) `runSync` on seeded effect == `runPromise` value; (4) `runSync` on `Effect.promise` throws `AsyncFiberError`; (5) TestClock `[0, 300000]`; (6) unbounded-concurrency seeded draws identical across `runPromise`/`runSync`; (7) **3 fresh processes ⇒ byte-identical JSON** (seeded draws + TestClock + fork/join); (8) fiber IDs `1` then `2` in two runs of the same process; (9) `Random.make` absent from rc.109 exports | ✅ executed (results below) |
| `docs/research/effect-v4-release-reality.md`, `docs/research/effect-v4-incremental-adoption.md` | Sibling wayfinder notes (tickets 01, 03): version pins, incremental path, standalone-adoptable modules | ✅ read |
| `docs/architecture/determinism-and-randomness.md` (DESIGN-08), `.ai/ENGINEERING-CONTRACT.md` | The determinism wall this note must respect (named streams, cross-OS hashes, forbidden ambient reads) | ✅ read |

## 3. Findings

### 3.1 Pure/erasable vs runtime-bound

- **Runtime-free (values + derivations, no fibers/services):** `Schema`
  (v4 keeps sync decode: `Schema.decodeSync`; sync-only usage needs no
  runtime), `Data` (incl. `Data.TaggedError` structured errors), `Option`,
  `Result` (v4 rename of `Either`), `Predicate`, `Cause` and `Exit` as data
  structures, `Equal`/`Hash`, `Chunk`, `HashMap`, `HashSet`, `Duration`,
  `DateTime`, `Order`/`Equivalence` [ticket-03 note; v4 docs data-types
  sections; `Schema` docs]. v4 additionally makes plain objects structurally
  equal by default, so `Schema.Data`-style wrappers are unnecessary
  (Schema migration guide: "`Equal.equals` performs deep structural comparison
  on objects by default in v4").
- **Runtime-bound:** executing an `Effect` — the runtime system "creates a root
  fiber, initializing it with the initial context, initial fiber-local state,
  and the initial effect", then loops over instructions, spawns fibers on
  `forkChild`, performs cooperative yielding, handles async callbacks
  [Runtime docs]. The live default services `Clock`, `ConfigProvider`,
  `Console`, `Random`, `Tracer` are auto-provided to any effect with `R =
  never` [Default Services docs] — which is exactly why executing an Effect
  without explicit service provision silently becomes environment-dependent.
- `Effect` **construction** (building the blueprint) is runtime-free and
  deterministic; only `run*` execution engages the runtime [Runtime docs:
  "An `Effect` is merely a data structure that describes the execution of a
  concurrent program"].

### 3.2 Random: seeded and reproducible — yes, but only via explicit seeding

- **Default is `Math.random`.** v4 `internal/random.ts` defines the default
  `Random` reference as `{ nextIntUnsafe(){ return Math.floor(Math.random() * …) + MIN_SAFE }, nextDoubleUnsafe(){ return Math.random() } }`.
  The Default Services docs show the default draw "varies each run" [source;
  docs; probe (2): two runs differ].
- **`Random.withSeed(seed)` is the v4 deterministic path** (string | number
  seed). It provides a per-scope service backed by an **ISAAC CSPRNG**
  implemented in pure JS (32-bit masked arithmetic; string seeds are UTF-8
  encoded via `TextEncoder` into little-endian 32-bit words) [Random.ts
  source]. Doc contract: "Using the same seed produces the same random
  sequence, which is useful for tests and reproducible simulations." Doc
  examples pin exact outputs (`withSeed("example")` ⇒ `0.1633802591287037`).
- **Empirically verified on rc.109:** `withSeed("myseed")` ⇒
  `0.10428056576185751` — byte-identical to the official doc example; two
  `runPromise` runs with the same seed are identical (probe 1); the docstring
  values in v4 `main` match rc.109 (probe 3 + doc values) — the seeded
  algorithm is currently stable across the RC line.
- **Version stability caveat:** v3's deterministic path was `Random.make(seed)`
  (PCGRandom; `Hash.hash(seed)`-derived) [v3 branch source]; v4 replaced the
  algorithm and the API (`make` is **absent** from rc.109's exports —
  probe 9; v4 exports `withSeed` only). **Seeded output values are therefore
  NOT portable across majors (v3→v4) and are not guaranteed to survive future
  beta/RC changes** — sequences are only stable for a pinned version.
- **Neither v3 nor v4 exposes a global `Random.setSeed`** — the ticket's
  premise example does not match either line's public API. v3 = `make`/`fixed`;
  v4 = `withSeed` (per-scope provide). Seeding is compositional, not global.
- **No `TestRandom` in v4.** `effect/testing` exports FastCheck, TestClock,
  TestConsole, TestSchema only [testing/index.ts]; `withSeed` supersedes it.

### 3.3 Clock: controllable — yes, via TestClock; live default is wall clock

- Live `Clock` default: `currentTimeMillisUnsafe()` = **`Date.now()`**;
  `currentTimeNanosUnsafe()` uses `performance.now()` where available
  (arbitrary origin, monotonic); `monotonicTimeNanos` is documented as
  unsuitable for serialization [internal/core.ts; Clock.ts docs]. Wall clock
  "can move backward or forward when the system wall clock is corrected"
  [Clock.ts docs].
- `TestClock` (`effect/testing`, provided with `TestClock.layer()`): starts at
  `0`; `adjust(duration)`/`setTime(ms)` advance time and "any effects that
  were scheduled to occur on or before the new time will be run in order"
  [TestClock.ts source; TestClock docs]. `sleep` (and everything built on it:
  timeouts, schedules, retries) "semantically blocks until the clock time is
  set to on or after" the scheduled time; the documented pattern is **fork the
  effect, adjust the clock, then join/verify** — an unadjusted TestClock
  hangs (with a warning fiber after ~5 s) [TestClock docs/source; probe 7
  initially demonstrated the hang + warning].
- Verified on rc.109 (probe 5): `currentTimeMillis` under `TestClock.layer()`
  = 0, then 300000 after `adjust("5 minutes")` ⇒ deterministic, t0-relative
  time. `withLive` escapes to the real clock when needed [TestClock.ts].

### 3.4 Concurrency model: cooperative, single-threaded; deterministic in practice, undocumented in principle

- **No worker pools/threads in the core runtime.** Fibers are cooperative:
  the `Scheduler` decides "when queued tasks run and when a fiber should pause
  so other work can continue"; `SchedulerDispatcher.scheduleTask(task,
  priority)` with "lower priority numbers run first, equal priorities in FIFO
  order", and `flush()` "drains pending work synchronously, which is useful
  when callers need **deterministic completion** of already scheduled tasks"
  [Scheduler.ts docs — this is the closest thing to a documented determinism
  guarantee in the runtime].
- **Execution modes:** `MixedScheduler` defaults to `"async"` mode dispatching
  via `setImmediate` (fallback `setTimeout(0)`); `"sync"` mode dispatches via
  microtasks. `runSync` constructs `new MixedScheduler("sync")` and **flushes
  the fiber's dispatcher synchronously**, so a fully synchronous effect runs
  to completion on the current thread; if the effect still hasn't completed
  after the flush it fails with `AsyncFiberError` ("An asynchronous Effect was
  executed with Effect.runSync") [internal/effect.ts `runSyncExitWith`;
  Running Effects docs]. `runPromise`/`runFork` use the default async
  scheduler [internal/effect.ts].
- **Yielding:** a fiber yields when `currentOpCount >= maxOpsBeforeYield`
  (default **2048** ops; `PreventSchedulerYield` disables the check) [Scheduler.ts;
  internal/effect.ts]. Interleaving across a yield point is determined by the
  effect's structure, the op budget, and the dispatcher's priority/FIFO
  ordering — deterministic for identical code + pinned Effect version on the
  same engine, but **not documented as a contract**.
- **Result ordering of parallel collections is stable** (`Effect.all`/
  `forEach` with `concurrency` return results in input order; the docs show
  the *start/stop* interleaving of side effects varying with the concurrency
  setting) [Basic Concurrency docs].
- **Empirical cross-process probe (rc.109, Node v24.18.0):** a program mixing
  `Random.withSeed("xproc-seed")` draws, an 8-effect `forEach` with
  `concurrency: "unbounded"`, `forkChild` + `TestClock.adjust("5 minutes")`,
  and `Clock.currentTimeMillis` produced **byte-identical JSON in 3 fresh
  Node processes** (probe 7). So for the pattern "seeded Random + TestClock +
  pure synchronous effects", single-threaded execution is empirically
  deterministic across processes on this platform — but this is **not an
  Effect-documented guarantee**; the repo's child-process harness remains the
  verification authority.
- **No documented cross-OS / cross-process determinism guarantee exists.** The
  official docs state the defaults are environment-dependent ("varies each
  run"; wall clock), and nothing in the Runtime/Scheduler/Concurrency docs
  promises reproducible outcomes across OSes, engines, or processes. Any
  cross-OS claim must be earned by the repo's pinned Node/V8 + pinned Effect
  version + harness, per DESIGN-08.

### 3.5 Keeping an Effect computation deterministic (recipe)

1. **Use only the runtime-free modules in the authoritative core** (Schema
   sync decode, Data, Option, Result, Cause/Exit-as-data, Equal/Hash) and keep
   `Effect` execution out of authoritative hashing where possible (ticket-03
   note: standalone-adoptable without the runtime).
2. **Never rely on the default services.** Provide `Random` via
   `Random.withSeed(seed)` (or a per-stream service built on it) and `Clock`
   via `TestClock.layer()` (or a provided fixed clock) for any effect that
   touches them; the defaults are `Math.random` and `Date.now()`.
3. **Keep authoritative effects synchronous and pure:** `runSync` executes on
   the current thread with a synchronous flush; avoid `Effect.promise`/async
   callbacks in authoritative paths (they raise `AsyncFiberError` under
   `runSync` and tie outcomes to host event-loop timing under `runPromise`).
   If `runPromise` must be used, treat scheduler interleaving as unverified
   and verify via the child-process harness.
4. **Fork-then-adjust for time:** under TestClock, `sleep`-based effects
   (timeouts, schedules) need `forkChild` + `adjust` before they proceed.
5. **Version-pin Effect + Node.** Seeded sequences are algorithm-specific
   (ISAAC in v4; PCG in v3), the runtime was rewritten in v4, and the RC line
   still moves — pin the exact version (and the exact Node line for the
   harness).
6. **Keep draws sequential or per-stream.** Effect's `Random` is one flat
   stream per provided service; DESIGN-08 named hierarchical streams must be
   built on top (per-stream seeded services or a Ref-held generator), and
   concurrent fibers must not share one stream whose draw order is only
   incidentally deterministic.

### 3.6 Nondeterminism traps (each verified against source and/or probe)

1. **Default `Random` (`Math.random`)** — forbidden by DESIGN-08; docs show it
   varies per run [Default Services docs; internal/random.ts].
2. **Live `Clock` (wall clock)** — `Date.now()`/`performance.now()`; any
   sleep/timeout/schedule/timestamp under the live clock is wall-clock
   dependent [internal/core.ts; Clock.ts].
3. **`race`/`raceFirst`/`raceAll`/`timeout`** — "first to complete wins";
   `Effect.timeout` is literally `raceFirst(self, flatMap(sleep(duration),
   orElse))` [internal/effect.ts]. With the live clock these are timing-
   dependent; with TestClock they are controllable, but a race whose arms
   complete "simultaneously" (same logical time) is decided by scheduler
   interleaving, which is undocumented.
4. **Fiber IDs are module-global, non-resetting counter state.** v4:
   `const fiberIdStore = { id: 0 }`; `this.id = ++fiberIdStore.id`
   [internal/effect.ts]. Probe (8): an interrupted effect's `Cause` carried
   `fiberId: 1` on run 1 and `fiberId: 2` on run 2 **of the same process** —
   any authoritative record that serializes `Cause`/`Exit`/interrupt
   annotations containing fiber IDs is not reproducible within a process.
   (Fresh processes reset the counter to 1 — cross-process runs agree, which
   is why the cross-process harness masks this trap.) DESIGN-08 also bans
   mutable global singleton state in authoritative packages outright.
5. **`HashSet`/`HashMap` iteration order** — documented as **unordered**
   collections [HashSet docs]; iteration follows HAMT hash-layout
   (deterministic for identical values + insertion sequence + pinned Effect
   version, but not a contract, and not insertion order). Serializing set
   iteration order as canonical data violates DESIGN-08's "never treat
   incidental JavaScript insertion order as the canonical contract" — sort or
   use `Chunk`/`Array` for canonical ordering.
6. **`Promise`/async interop** — breaks `runSync` (`AsyncFiberError`), and
   under `runPromise` outcomes depend on host timer/event-loop behavior
   (timer coalescing, resolution ordering).
7. **Scheduler op-budget yields** — CPU-bound fibers beyond 2048 ops yield
   mid-computation; interleaving is deterministic only for identical effect
   structure + pinned Effect version + single thread, and is undocumented.
8. **Fiber keep-alive** (v4 behavior change) — forked fibers keep the process
   alive (migration guide); the child-process harness must await/interrupt
   fibers before exit to avoid hangs (probe 7 initially hung on an unadjusted
   TestClock sleep; the documented fork+adjust pattern resolves it).

## 4. Recommendations (for the engine-core policy ticket 05 and implementers)

**Normative (facts the policy may rely on):**

1. **Keep the authoritative core runtime-free.** Adopt Schema/Data/Option/
   Result/Cause/Equal/Hash first (ticket-03 path) — these add no determinism
   risk. Introduce `Effect` execution only behind an explicit policy: pure
   synchronous effects, `runSync`, explicit service provision.
2. **Never use Effect defaults for Random or Clock in authoritative code.**
   Default `Random` = `Math.random` (DESIGN-08 violation if used); default
   `Clock` = wall clock. Use `Random.withSeed(seed)` per scope/stream and
   `TestClock.layer()` (or a provided fixed clock) for all time.
3. **Keep DESIGN-08 named hierarchical streams as the RNG authority.** Effect's
   `Random` provides a deterministic primitive (per-scope, one flat stream);
   the named-stream ledger, per-draw records, and stream identity stay
   Bluewave-owned. Do not replace the DESIGN-08 stream layer with Effect's
   Random (matches the map's out-of-scope line).
4. **Never serialize fiber identity or runtime metadata.** Strip/never capture
   `fiberId`, interrupt `Cause` annotations, and `startTimeNanos`-style
   runtime timestamps from authoritative records; fiber IDs do not reset
   within a process (verified), so they are unreproducible in-process.
5. **Pin Effect exactly** (v4 RC line today is `4.0.0-rc.109`; stable v4 not
   yet shipped — see ticket-01 note) and pin the Node line. Seeded sequences
   and runtime behavior are version-specific (v3 PCG vs v4 ISAAC; runtime
   rewrite). Treat any version bump as a potential golden-hash change requiring
   the ADR-documented authoritative-cause process.
6. **Extend the child-process determinism harness to Effect-using packages:**
   compare identical seeded runs (a) across fresh processes, (b) across
   `runSync` and `runPromise` entry points, (c) with TestClock-driven time.
   Note the harness's fresh-process-per-run property also resets the
   module-global fiber-ID counter — add an in-process repeated-run check to
   catch the fiber-ID trap.
7. **Authoritative collections use `Chunk`/`Array` (ordered);** canonical
   output never derives ordering from `HashSet`/`HashMap` iteration.

**Balance-target / non-normative (not facts):**

- The empirical cross-process determinism observed on rc.109 (probe 7) is
  evidence, not a contract — the policy must not cite "Effect is
  deterministic" as a documented property; it must cite "verified by harness
  for pinned versions".
- Scheduler interleaving determinism for effects > 2048 ops is unverified
  territory; keep authoritative effects under the op budget or verify
  explicitly.

## 5. Deferred

- **Cross-engine determinism** (V8 vs JSC/Hermes): Effect's docs make no
  cross-engine claims; DESIGN-08 requires cross-OS determinism for the
  supported Node/V8 line only. If a non-V8 engine ever becomes a supported
  authoritative platform, re-research.
- **ISAAC algorithm stability through the RC→stable transition:** doc-example
  values currently match rc.109↔main, but no official statement pins the
  seeded algorithm; re-verify at the 4.0.0 stable pin.
- **`Fiber.race`/`raceFirst` tie-breaking:** undocumented; if the engine ever
  needs racing semantics in authoritative paths, the tie-break must be
  engine-defined (e.g., explicit deterministic priority), not Effect's
  interleaving — out of scope for this note.
- **No conflict with `docs/OPEN-ISSUES.md`:** no open decision in that
  registry touches these findings. DESIGN-55 (deferred mechanics) is
  unaffected; nothing here researches unreachable deferred mechanics.
