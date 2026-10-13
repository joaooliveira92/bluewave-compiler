# Effect v4 idioms (Bluewave)

Distilled from the vendored `effect@4.0.2` source. Ground every unfamiliar API in
`repos/effect/LLMS.md` and the relevant `repos/effect/packages/effect/src/*`
before writing Effect code.

## Imports

Everything lives in the single `effect` package (`Data`, `Schema`, `Result`,
`Option`, `Context`, `Layer`, `Effect`, `Stream`, `Cause`, …). Import the
subpath that matches: `effect/Schema`, `effect/Data`, `effect/Result`,
`effect/Option`, `effect/Effect`. Never resolve `effect` from the npm registry —
consumers declare `"effect": "workspace:*"` against `vendor/effect`.

## Runtime-free subset (pure packages)

Pure/deterministic packages (`combat`, `ship-design`, `campaign`, `random`,
`deterministic`, `contracts`, `armament`) use only `Schema`/`SchemaIssue`, `Data`,
`Data.TaggedError`, `Result`, `Option`, `Predicate`, `Equal`/`Hash` — no
`Effect`/`Layer`/runtime.

## Schema (replaces Zod)

- Define with `Schema.Struct`, `Schema.String`/`Number`/`Boolean`/`Unknown`,
  `Schema.Array`, `Schema.Record`, `Schema.Literal`/`Schema.Literals`,
  `Schema.optional`, `Schema.NullOr`, `Schema.Union`, and
  `Schema.withDecodingDefaultType` for input defaults.
- Decode at boundaries: `Schema.decodeUnknownSync(s)(x)` (parse) or
  `Schema.decodeUnknownResult(s)(x)` (safe parse). `Schema.Struct` **strips**
  excess keys by default (`onExcessProperty: "ignore"`), matching non-strict
  `z.object`; reject them only by passing `{ onExcessProperty: "error" }` at
  decode (ADR-0104 §3, ADR-0105 §2).
- Type is `typeof S.Type` (preferred over `Schema.Schema.Type<typeof S>`).
- Wire formats are frozen: every schema change carries a parity test built from
  the existing fixture; never dual-maintain Zod + Schema.

## Errors

- In-process domain errors: `Data.TaggedError`. Serializable/wire errors:
  `Schema.TaggedError`.

## Runtime (IO/orchestration boundaries only)

`persistence`, `apps/desktop/src/main`, `apps/compiler-cli`, `ai`, and
`phase-engine` may use the full runtime: `Effect.gen`/`Effect.fn`, `Layer`,
`Context.Service`, `ManagedRuntime`, cancellation via `Scope`, typed `Cause`.
Introduce a runtime where an effect is _run_, never inside a pure derivation.

## Notes

- `skipLibCheck: true` is load-bearing (Effect's `Channel.d.ts` references the DOM
  `TextDecoderOptions` global).
- Keep the DESIGN-08 named hierarchical RNG streams as the randomness authority;
  Effect's `Random` is a primitive, not a replacement.
