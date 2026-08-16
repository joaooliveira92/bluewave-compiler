# Ticket 04 — Runtime Determinism Profile

**Type:** research
**Status:** resolved
**Blocked by:** none

## Question

What is the determinism story of the Effect runtime in v4? Which parts are
pure/erasable (Schema, Data, structured errors) vs. runtime-bound
(Effect/Fibers/Clock/Random/Scheduler)? Is Effect's `Random`/`Clock` seeded and
reproducible? Does Effect's concurrency model stay deterministic across
processes, and what are the documented guarantees and caveats about determinism
across OSes and process boundaries? How does one keep an Effect-based
computation deterministic (seeded randomness, single-threaded fiber scheduling,
Deterministic/TestClock)?

This grounds the engine-core policy ticket (05). Resolve via a `/research`
subagent against primary sources (Effect docs, source, determinism/concurrency
sections). Context pointer → `docs/research/effect-v4-runtime-determinism.md`.

## Answer

Research note: `docs/research/effect-v4-runtime-determinism.md`. Clean
pure/runtime seam: `Schema` (sync decode), `Data`, `Option`, `Result`,
`Predicate`, `Cause`/`Exit` data, `Equal`/`Hash`, `Chunk`/`HashMap`/`HashSet`
are runtime-free; only executing `Effect` engages the runtime (fibers + the five
live default services: `Clock`, `Random`, `Console`, `ConfigProvider`,
`Tracer`). `Random.withSeed(seed)` is deterministic (ISAAC, pure JS, verified
on `4.0.0-rc.109`) but the **default** Random is `Math.random` and there is
**no global setSeed**; `TestClock.layer()` controls the clock. **No documented
cross-OS/cross-process determinism guarantee** — only `SchedulerDispatcher`
priority+FIFO + runSync are "deterministic"; empirical evidence: byte-identical
JSON across 3 fresh Node processes for a seeded + TestClock + runSync program
(evidence, not contract). **Nondeterminism traps for ticket 05**: default
Random/live Clock; fiber IDs (module-global counter, not reset — strip from
records, add in-process repeated-run check); `race`/`raceFirst`/`raceAll`/
`timeout` (timing-dependent); `HashSet`/`HashMap` iteration order (unordered —
never canonical); Promise/async interop + scheduler op-budget yields (>2048
ops) break runSync and determinism.