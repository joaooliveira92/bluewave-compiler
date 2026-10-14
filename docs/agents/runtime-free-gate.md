# Runtime-free import gate

`scripts/assert-runtime-free.mjs` fails closed when a runtime-free root imports
the Effect runtime. It enforces [ADR-0100](../../docs/adr/ADR-0100-adopt-effect-v4.md) §2
(the runtime-usage boundary). [ADR-0159](../../docs/adr/ADR-0159-effect-runtime-in-app-surfaces.md)
adopts the full runtime in `apps/desktop/src/main` and `apps/compiler-cli`,
superseding ADR-0128 for the app surfaces.

## Guarded roots

The runtime-free packages from ADR-0100's policy table, plus the
renderer-reachable `campaign-engine`:

- `packages/{ai,armament,campaign,campaign-engine,combat,commands,content-schema,contracts,deterministic,diagnostics,events,phase-engine,random,ship-design,ship-visual}/src`

`persistence` and `content-compiler` are IO boundaries, and
`apps/desktop/src/main` and `apps/compiler-cli` are the runtime app surfaces
(ADR-0159); all are deliberately **not** guarded.

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
