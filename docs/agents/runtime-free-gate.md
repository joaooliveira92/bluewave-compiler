# Runtime-free import gate

`scripts/assert-runtime-free.mjs` fails closed when a runtime-free root imports
the Effect runtime. It enforces [ADR-0100](../../docs/adr/ADR-0100-adopt-effect-v4.md) §2
(the runtime-usage boundary) and
[ADR-0128](../../docs/adr/ADR-0128-effect-v4-runtime-wave-not-warranted.md)
(no `ManagedRuntime` was introduced).

## Guarded roots

The runtime-free packages from ADR-0100's policy table, plus the
renderer-reachable `campaign-engine` and the synchronous desktop main process:

- `apps/desktop/src/main`
- `packages/{ai,armament,campaign,campaign-engine,combat,commands,content-schema,contracts,deterministic,diagnostics,events,phase-engine,random,ship-design}/src`

`persistence`, `content-compiler`, and `compiler-cli` are explicit IO/entrypoint
boundaries and are deliberately **not** guarded.

## Rule

Only the runtime-free subset may be imported from `effect`:
`Data`, `Equal`, `Hash`, `Option`, `Predicate`, `Result`, `Schema`,
`SchemaIssue` (and the matching `effect/<Name>` subpaths). Everything else —
`Effect`, `Layer`, `Context`, `ManagedRuntime`, fibers, any `effect/unstable/*`,
any `@effect/*` package, a namespace import, or a dynamic import — is a
violation. The set is an allowlist, so an unrecognised `effect` export fails
rather than slipping through.

## Usage

```
node scripts/assert-runtime-free.mjs              # check the real tree
node scripts/assert-runtime-free.mjs --self-test  # run embedded fixtures
```

Both are wired into `pnpm preflight` (the self-test gates the real check) and the
detection boundary has a `pnpm test:scripts` fixture
(`scripts/test/assert-runtime-free.test.mjs`). The check reads no clock, RNG,
environment, or network, so its verdict is deterministic.

To move a package onto the runtime-free list, add its `src` directory to
`RUNTIME_FREE_ROOTS`; to permit a new runtime-free symbol, justify it in the
change and add it to `RUNTIME_FREE_SYMBOLS`.
