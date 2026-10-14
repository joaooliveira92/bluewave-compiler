# Schema usage conformance vs vendored effect@4.0.2

**Type:** research
**Status:** resolved
**Blocked by:** none

## Question

Does Bluewave's `Schema` usage conform to the real behaviour and idioms of the
vendored `effect@4.0.2`? Ground every claim in `vendor/effect` source and its tests,
not prior knowledge.

Targets (all authored, `packages/**` + `apps/**`):

- **Boundary decode helpers** — `packages/content-schema/src/decode.ts`,
  `schema-validator.ts` (`decodeUnknownSync` / `decodeUnknownResult`, the strict
  `{ onExcessProperty: "error" }` policy); `packages/persistence/src/store.ts`.
- **Closed-struct assumption** — `01_schema/10_schema-basics.ts` says `Schema.Struct`
  is closed by default; ADR-0104/0105 say it *strips* excess keys unless
  `onExcessProperty: "error"` is set. Cross-check against vendored
  `packages/effect/src/Schema.ts` + tests (see ticket 04 for the executable probe).
- **Filters** — heavy use of `Schema.isInt`, `isMinLength`, `isMaxLength`, `isBetween`,
  `isPattern`, `isGreaterThan`, etc. Confirm these are the idiomatic v4 form (vs
  `Schema.filter` / `makeFilter`), and that `Schema.makeFilter` usage is correct.
- **Decode defaults** — `Schema.withDecodingDefaultType`, and the lone
  `Effect.succeed([])` default in `packages/persistence/src/schemas.ts:50`. Is passing
  an `Effect` the documented API, and is that the only option?
- **`SchemaIssue`** — `SchemaIssue.makeFormatterStandardSchemaV1` usage: is it the sink
  for surfacing failures at a boundary?
- **`Schema.TaggedError`** is *not* used (only `Data.TaggedError`); confirm that is the
  right choice for our reachability model (see ticket 02).

Deliver: a severity-tagged verdict per target, each with the vendored file/test line
that proves it, and a recommended remedy (code / doc / ADR / accept). Write durable
findings to a note under `docs/research/`.

## Answer

Resolved. Evidence: `docs/research/effect-conformance-01-schema.md`.

- **F1 (Blocker, doc):** `Schema.Struct` **strips** excess keys by default — it is
  *open*, not closed. Vendored `vendor/effect/src/SchemaAST.ts:490,526-539`,
  corroborated by `repos/effect/packages/effect/test/schema/Schema.test.ts:666-678`.
  Contradicted docs: `agent-patterns/effect-idioms.md:27-29`,
  `docs/adr/ADR-0102-replace-zod-with-effect-schema.md:40`, and `RULES.md:74`;
  ADR-0104 §3 / ADR-0105 §2 are correct. Remedy: doc fix.
- **F2 (Info, accept — corrected):** the shared `Effect.succeed([])` default at
  `packages/persistence/src/schemas.ts:50` does **not** alias the five defaulted
  array fields. An executable probe shows `withDecodingDefaultType` on a
  `Schema.Array` re-materialises a fresh array per decode; the first reading
  conflated `SchemaGetter.withDefault`'s opaque path. Only a *non-array* mutable
  default would alias. No code change.
- **F3–F6, F8 (Info, accept):** an `Effect` is the *required* argument to
  `withDecodingDefaultType` (no plain-value alternative); filters (`isInt` … `makeFilter`)
  are the idiomatic v4 form; `SchemaIssue.makeFormatterStandardSchemaV1` is the right
  sink; never using `Schema.TaggedError` is correct per ADR-0152; `decodeUnknownResult`
  is safe for plain structural decode.
- **F4 (Minor style):** prefer `Schema.Int` over `Schema.Finite.check(Schema.isInt())`.
- **F7 (Minor, doc):** `ADR-0102 §5` lists non-existent v3 names
  (`Schema.pattern/int/between/transform/filter/optionalWith`).
- **Ticket hygiene:** the ticket's `01_schema/10_schema-basics.ts` attribution is wrong —
  that vendored file carries no closed-struct claim; the claim is only in
  `effect-idioms.md`, `ADR-0102 §4`, and `RULES.md`.

## Remediation applied (2026-10-13)

- **F1 (doc):** corrected `agent-patterns/effect-idioms.md`, `ADR-0102 §4`, and
  `RULES.md:74` to "strips by default; pass `{ onExcessProperty: "error" }` to
  reject"; fixed ADR-0104 §3's unsupported "JSON-Schema emission default"
  rationalization; also dropped the non-existent `Schema.optionalWith` name from
  the idiom doc's `Schema` list.
- **F7 (doc):** rewrote `ADR-0102 §5`'s conceptual mapping table to the real v4
  names (`isPattern`/`isInt`/`isBetween`/`isMinLength`/`isMaxLength`/`makeFilter`/
  `decodeTo`/`encodeTo`/`withDecodingDefaultType`).
- **F2 (withdrawn):** the proposed per-use default + identity test was reverted —
  the probe proves no aliasing and the test could not fail for the claimed reason
  (`RULES.md:113`). The finding is corrected in
  `docs/research/effect-conformance-01-schema.md`.
- **F4:** accepted as optional style (no change).
