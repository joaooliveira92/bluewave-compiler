# INC-6 — compiler-cli entrypoint facade

**Type:** implementation
**Status:** open
**Blocked by:** INC-1
**Frontier:** no

**What to build:** Adopt the runtime at the compiler-cli entrypoint: `main()` runs one
dispatch program over a `ManagedRuntime`, while the `run*` internals stay synchronous
(called directly inside `Effect.gen`, never converted to async).

## Acceptance criteria

- [ ] `apps/compiler-cli`'s `main()` builds one runtime and runs a single dispatch
      program; no `run*` internal is converted from sync to async (ERA-R12).
- [ ] The six-code exit contract (`success:0`, `validation-error:1`, `compile-error:2`,
      `aborted:3`, `internal-error:4`, `usage-error:5`) is preserved via an explicit
      mapping; `Runtime.makeRunMain` defaults are not adopted (ERA-R13).
- [ ] `parseOptions`/`parseBattleAdvanceMinuteOptions`/`parseGunneryResolveShotOptions`
      and the `--json`/human output modes stay at the edge, unchanged.
- [ ] Every command's stdout and exit code is byte-identical to before (fixtures);
      goldens byte-identical (ERA-R5, R7).
- [ ] `pnpm preflight` and the compiler-cli test suite are green.

## Notes for implementator

- The CLI is fully synchronous today; the facade is the whole point. Service
  extraction (`CliFileSystem`, `ContentCompilerService`, …) is incremental and may
  follow in later slices — this ticket delivers the entrypoint facade.
- `Runtime.makeRunMain`'s exit-code mapping does not match the six-code contract, so
  map explicitly and set `process.exitCode`.
