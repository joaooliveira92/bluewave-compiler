# ADR-0105: `content-schema` Effect Schema boundary — strict excess-key policy

## Status

Accepted (2026-10-11).

## Context

ADR-0102 replaces Zod with Effect Schema boundary-by-boundary, atomically, with
frozen wire formats. `@bluewave/content-schema` is the largest such boundary: it
owns the content-pack structural schemas (`area`, `design`, `manifest`, `nation`,
`naval-profile`, `naval-profile-vocab`, `port`, `possession`, `route`,
`ship-component`, `technology`) plus the `schema-validator` used by
`@bluewave/content-compiler` and `@bluewave/campaign`. It is a textbook pure
package: synchronous structural validation only, no IO, no runtime services, and
its public shape is consumed by Node compiler/engine tests and by the desktop main
and renderer.

Two semantic gaps had to be closed before the swap could be called parity-safe:

1. **Numbers.** Zod v4's `z.number()` rejects `NaN`/`Infinity`/`-Infinity`; Effect's
   `Schema.Number` accepts them. Parity requires `Schema.Finite` (as ADR-0104
   established for persistence).
2. **Excess keys.** Effect v4's `Schema.Struct` **strips** unmodeled keys on decode
   by default, while the previous definitions used `.strict()` (reject) in many
   places and open `z.object` (strip) in others. The pre-migration behavior for
   every existing fixture had to be preserved.

## Decision

1. **The whole `content-schema` surface migrates in one coherent step.** Every Zod
   definition is deleted as its Effect Schema replacement lands; no dual
   definition and no Zod import remains (`MIG-ZOD-1`, `MIG-ZOD-2`). The package
   depends on the vendored `effect` workspace package and no longer on `zod`.
2. **`z.number()` → `Schema.Finite` everywhere.** `Schema.Finite.check(...)` carries
   the integer/range refinements (`isInt`, `isBetween`, `isGreaterThan`,
   `isGreaterThanOrEqualTo`), reproducing the Zod bounds exactly. A focused parity
   test rejects `NaN`/`Infinity`/`-Infinity` where Zod did.
3. **Strictness policy: decode every content-schema boundary with
   `{ onExcessProperty: "error" }`.** This rejects excess keys, preserving the
   previous `.strict()` rejection byte-for-byte and tightening previously-open
   `z.object` schemas **fail-closed**. This is a strengthening, never a weakening:
   the engineering contract forbids weakening production validation, and the real
   production pack's `area`/`port`/`possession`/`route`/`technology`/`ruleset`
   entries carry exactly the modeled keys. `Schema.Record` dynamic-key maps still
   accept arbitrary keys under the option (verified, and pinned by a parity test).
4. **The policy is centralized in two exported helpers** (`decode.ts`):
   `decodeStrict` (throws; the `Schema.parse` replacement) and
   `decodeStrictResult` (returns `Result`; the `Schema.safeParse` replacement).
   Every transitive consumer uses them, so no consumer needs to declare `effect`
   directly and the exact option cannot drift between call sites. The helpers keep
   the renderer free of a **direct source** Effect import, but they do not remove
   Effect from the renderer **bundle**: the renderer already imported
   `@bluewave/content-schema` (previously on Zod) and now transitively pulls
   `effect`/`Schema` through it (see "Known deviations" below).
5. **`schema-validator` is re-expressed over Effect Schema.** It decodes with
   `Schema.decodeUnknownResult(schema, { onExcessProperty: "error", errors: "all" })`,
   flattens the issue tree with the public
   `SchemaIssue.makeFormatterStandardSchemaV1()` (path + message), and emits one
   `SCHEMA` diagnostic per issue in the existing `stage: "validate"` /
   `sourceLocation` shape, with a remediation hint for a missing key. The `T |
   undefined` contract is preserved.
6. **Cross-field refinements use `Schema.makeFilter` with a string `message`
   annotation.** In `effect@4.0.2` `Annotations.Filter.message` is a **string**
   (the migration sketch's `{ message: () => msg }` function form is not read by
   the formatter and does not typecheck); `Schema.refine` additionally requires a
   type-guard predicate, which non-narrowing cross-field checks are not. The
   refinement result (accept/reject) is identical to Zod's `.refine`.
7. **`NationIdSchema.options` (a Zod-only API) is replaced by an exported
   `NATION_IDS` const tuple** as the stable member list; the schema is
   `Schema.Literals(NATION_IDS)`. Exported schema types use the v4 idiom
   `typeof S.Type`.
8. **`content-compiler`'s validate stage consumes the Effect schema type view.** The
   `schemas` map value is typed with the re-exported `ContentSchema` (an Effect
   `ConstraintDecoder<unknown, never>`) instead of Zod's `ZodSchema`; `zod` is
   removed from the package and no logic, stage ordering, or emitted artifact
   changes.
9. **Runtime-free.** Only `Schema` and `SchemaIssue` (the runtime-free schema
   subsystem) are imported; there is no `Effect`/`Layer`/`ManagedRuntime` in the
   package.

## Consequences

- The content-pack boundary has one validator idiom; `zod` is gone from
  `content-schema` and `content-compiler` (and from their resolved dependency
  surface).
- Wire parity is proven from existing fixtures: the authored armament catalogue and
  the full authored naval-profile catalogue decode under the strict policy, the
  content-compiler fixtures produce identical pass/fail and diagnostic codes, and
  the ship-design/phase-engine/campaign/desktop suites stay green.
- Excess-key handling for the previously-open schemas is now fail-closed. This is
  intentional and safe for the current production pack (exact keys); a future pack
  with extra keys will now fail loudly rather than silently dropping them.
- The exported decode helpers are the single knob for the strictness policy; a
  later boundary (events, campaign-engine, combat, desktop main) can adopt them
  without re-deriving the option.

## Known deviations and follow-ups

1. **Renderer bundle (MIG-EXCL-1 deviation).** The renderer
   (`apps/desktop/src/renderer/screens/construction/drawing-board/content.ts`)
   validates bundled ship-building YAML through the content-schema decode helpers
   and therefore **transitively bundles Effect Schema**, contradicting the
   final-state MIG-EXCL-1 intent ("renderer imports no `effect`; bundle delta ≈ 0").
   This is pre-existing off-architecture content validation: the renderer already
   imported `@bluewave/content-schema` (on Zod) and `@bluewave/ship-design`
   synchronously before this change, so the swap is Zod→Schema, not new coupling.
   It is recorded, not hidden. The renderer decoupling (move validation to the main
   process and pass decoded content over IPC) and the renderer bundle-size + `snap`
   gate are scheduled to **Wave 5** (spec §5.2), which owns `MIG-EXCL-1`.
2. **Exported types are the readonly Effect view.** Schemas export
   `typeof S.Type`, which is deeply `readonly` (unlike Zod's mutable `z.infer`).
   ADR-0104 applied a package-local `Mutable<>` alias where an existing caller
   mutated a decoded value; here no present consumer mutates one (the full
   workspace typecheck is green), and the ticket/spec idiom is
   `typeof S.Type`/`Schema.Schema.Type`. A consumer that later needs to mutate a
   decoded value applies its own `Mutable<>` at its own boundary, exactly as
   `@bluewave/persistence` does — content-schema will not export a mutable mirror
   that competes with the schema type.
3. **`SCHEMA` diagnostic granularity.** The migrated `schema-validator` emits one
   `SCHEMA` diagnostic per Effect issue, so e.g. two excess keys now produce two
   diagnostics where Zod produced one "Unrecognized keys" issue, and a missing key
   now carries an "Add missing field '<path>'" remediation (Zod's
   `message.includes("required")` guard never matched). The stable contract is
   preserved: code `SCHEMA`, `stage: "validate"`, the `sourceLocation` shape, and
   `accept/reject` parity. No compiler fixture or consumer asserts the diagnostic
   count or text. Ticket 09's "identical diagnostics" is read as identical
   code/stage/sourceLocation/accept-reject.

## Alternatives considered

- **Rely on `Schema.Struct`'s default strip behavior.** Rejected: it silently
  drops excess keys, which weakens the previously-`.strict()` boundaries and
  violates the no-weakening rule.
- **Keep `z.object`-like strip for the previously-open schemas.** Rejected: two
  strictness modes on one boundary is a latent source of divergence; the
  fail-closed option is uniform and matches the "reject unknown fields by default"
  content contract.
- **Use `Schema.Number` and accept `NaN`/`Infinity`.** Rejected: it is a wire
  semantic regression from Zod v4.
- **Have each consumer call `Schema.decodeUnknownSync` directly.** Rejected: it
  would force an `effect` dependency onto every consumer package (including the
  renderer, forbidden by ADR-0100) and let the strict option drift per call site.
- **Keep `Schema.Struct`-per-schema `.strict()` emulation.** Rejected: Effect v4 has
  no per-struct strict flag; the decode option is the correct seam.

## Related

- ADR-0100 (adopt Effect v4), ADR-0101 (vendor Effect), ADR-0102 (replace Zod with
  Effect Schema), ADR-0104 (`persistence` Effect beachhead — `Schema.Finite` and
  readonly/mutable type mapping precedent).
- `.scratch/effect-v4-vendor-migration/issues/08-boundary-content-schema.md`,
  `.../09-boundary-content-compiler-validate.md`.
- `agent-patterns/effect-idioms.md`.
