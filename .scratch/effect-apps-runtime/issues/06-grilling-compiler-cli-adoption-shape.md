# 06: compiler-cli adoption shape

**Type:** grilling
**Status:** resolved
**Blocked by:** 03

## Question

How does `apps/compiler-cli` adopt the runtime given it is **fully synchronous**
today (every `run*` returns `ExitCategory`, no `async`/`await`, no
`node:child_process`)?

- Decide the shape: a thin `Runtime.runMain`/`Effect.runPromise` facade over the
  existing synchronous `run*` pipeline, **or** convert the `run*` internals to
  Effect programs. Weigh the sync→async behaviour-change risk (ADR-0159
  §Alternatives rejects an async conversion of the reads).
- Decide the **service set** for the CLI (`FileSystem` port over `node:fs`,
  `ContentCompilerService`, `CampaignCompilerService`, `CampaignPersistence`,
  `CombatService`) and whether they mirror the desktop services or stay
  CLI-local.
- Decide the **exit-code contract**: `Runtime.errorExitCode` / `Runtime.makeRunMain`
  vs the existing `exitCodes` + `ExitCategory` mapping — the CLI's exit codes are
  a public contract and must not change.
- Decide how `--json`/human output modes and `main.ts` option parsing stay at the
  edge.
- Confirm determinism (goldens byte-identical) and that no authoritative hash
  moves.

Deliverable: the CLI adoption shape + service set + preserved exit-code
contract, carried into the spec.

## Answer

Resolved autonomously 2026-10-14. The compiler-cli is fully synchronous today
(no `async`/`await`; every `run*` returns `ExitCategory`).

**Shape: entrypoint facade, not an async conversion.** `main.ts` builds one
runtime and runs a single dispatch program; the `run*` internals stay
synchronous. Synchronous work is called directly inside `Effect.gen` (RULES.md
§Services forbids `yield* Effect.sync(...)`); reads are never converted to async,
so behaviour is unchanged (ADR-0159 §Alternatives).

**Exit codes are a fixed contract.** `exitCodes`/`ExitCategory`
(`success:0`, `validation-error:1`, `compile-error:2`, `aborted:3`,
`internal-error:4`, `usage-error:5`) are preserved exactly; the edge maps the
final result/`Exit` to the same category and sets `process.exitCode`.
`Runtime.makeRunMain` defaults are **not** adopted (they do not match the six-code
contract); `Effect.runPromise` with an explicit mapping is used.

**Services (CLI-local, incremental).** `CliFileSystem` (raw `node:fs`/`node:path`
port), `ContentCompilerService`, `CampaignCompilerService`, `CampaignPersistence`,
`CombatService` — mirroring main where the underlying package is shared, but with
CLI-local signatures. The first slice is only the entrypoint facade; extraction of
`run*` bodies into services is per-slice.

**Edge stays at the edge.** `parseOptions`/`parseBattleAdvanceMinuteOptions`/
`parseGunneryResolveShotOptions` (pure, sync) and the `--json`/human output modes
are unchanged.

**Determinism.** Goldens byte-identical; no authoritative read becomes async.