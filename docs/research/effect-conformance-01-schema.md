# Research: Effect Schema usage conformance vs vendored `effect@4.0.2`

Research-only note (ticket `.scratch/effect-conformance/issues/01-schema-usage-conformance.md`).
Grounds a severity-tagged verdict for Bluewave's authored `Schema` usage against the
**vendored** `effect@4.0.2` source and tests. No code, content, or constants are authored
here. Captured 2026-10-13.

Authority order used (per the map's evidence rule): `vendor/effect/src` (byte-identical to
the `effect@4.0.2` npm tarball, `vendor/effect/UPSTREAM.md`) is evidence-of-truth for *what an
API does*; `repos/effect` (subtree, HEAD `c3fc3a4d`) is corroborating test evidence; the repo's
ADRs / `agent-patterns/effect-idioms.md` are policy of record, and a conflict with the vendored
truth is itself the finding.

## Question

Does Bluewave's authored `Schema` usage (in `packages/**` + `apps/**`) conform to the real
behaviour and idioms of the vendored `effect@4.0.2`? Six targets: boundary decode helpers,
the closed-struct assumption, filters, decode defaults, the `SchemaIssue` formatter sink, and
`Schema.TaggedError` vs `Data.TaggedError`.

## Sources

| tag | source | status |
| --- | --- | --- |
| [V] | `vendor/effect/src/*` (`Schema.ts`, `SchemaAST.ts`, `SchemaIssue.ts`, `SchemaGetter.ts`, `Data.ts`, `Effect.ts`, `internal/core.ts`, `internal/schema/standardSchema.ts`) | read directly this session; authoritative (npm `4.0.2`) |
| [T] | `repos/effect/packages/effect/test/schema/Schema.test.ts` | read directly this session; corroborating (subtree HEAD `c3fc3a4d`, stated `effect@4.0.2`) |
| [C] | authored consumers `packages/content-schema/src/{decode,schema-validator}.ts`, `packages/persistence/src/{schemas,store}.ts`, `packages/events/src/validation.ts`, `packages/combat/src/air-defense/attack.ts` | read directly |
| [P] | policy `agent-patterns/effect-idioms.md`, `docs/adr/ADR-0102/0104/0105/0152` | read directly |
| [G] | gates/tests `scripts/assert-runtime-free.mjs`, `packages/persistence/test/schema-serialization.test.ts`, `packages/content-schema/test/parity.test.ts` | read directly |

The ticket's reference to `01_schema/10_schema-basics.ts` as the source of the "closed"
claim is **inaccurate**: `vendor/effect/ai-docs/src/01_effect/02_schema/10_schema-basics.ts`
contains no such statement (it covers `Schema.Class`, `decodeUnknownEffect`, and
`Schema.TaggedError`). The false rule actually lives in [P] `agent-patterns/effect-idioms.md`
and `ADR-0102 §4` (see F1).

## Findings

### F1 — `Schema.Struct` is **open by default (strips excess keys)**; the repo idiom doc and ADR-0102 §4 state the opposite — **Blocker (false rule, doc-only)**

Vendored truth: the default parse option is `onExcessProperty: "ignore"`, which **strips**
unmodeled keys — it does **not** reject them.

- [V] `vendor/effect/src/SchemaAST.ts:490` — "`onExcessProperty` — `"ignore"` (default) strips unknown object keys; `"error"` fails."
- [V] `vendor/effect/src/SchemaAST.ts:526-539` — `@default "ignore"`: "The default, `"ignore"`, strips unspecified properties from the output."
- [V] `vendor/effect/src/SchemaAST.ts:3006` + `:3015-3045` — `const onExcessPropertyError = options.onExcessProperty === "error"`; the `UnexpectedKey` rejection loop runs **only** inside `if (onExcessPropertyError)`.
- [V] `vendor/effect/src/SchemaAST.ts:3120-3135` — the no-index fast path builds `out` from declared properties only (strip).
- [V] `vendor/effect/src/Schema.ts:16324` — "The default `onExcessProperty: "ignore"` matches the decoder default."
- [T] `repos/effect/packages/effect/test/schema/Schema.test.ts:666-678` — `it("ignore strips undeclared string and symbol properties")`: `{ a:"a", b:"b", c:"c", [sym]:"sym" }` decodes to `{ a:"a" }`; `:637-664` shows `"error"` rejects with "Expected no excess property".

Repo claims (the WRONG quotes are verbatim as found; those lines now carry the corrected text):
- **WRONG** — [P] `agent-patterns/effect-idioms.md:27-29`: "`Schema.Struct` is closed by default (excess keys rejected), matching Zod `.strict()`."
- **WRONG** — [P] `docs/adr/ADR-0102-replace-zod-with-effect-schema.md:40`: "`Schema.Struct` is closed by default in v4; parity with Zod `.strict()` is verified per schema, not assumed."
- **WRONG (explanation)** — [P] `docs/adr/ADR-0104-persistence-effect-beachhead.md:45-47` (§3) correctly states the decoder **strips**, but its parenthetical rationalizes the false note as "the JSON-Schema emission default"; [V] `Schema.ts:16319-16325` shows the JSON-Schema default is also `"ignore"` (open). Corrected.
- **CORRECT** — [P] `docs/adr/ADR-0104-persistence-effect-beachhead.md:43-48` (§3): a `Schema.Struct` **strips** unmodeled keys by default, matching non-strict `z.object`.
- **CORRECT** — [P] `docs/adr/ADR-0105-content-schema-effect-boundary.md:24-27,39-46` (§2/§3): it **strips** unless `{ onExcessProperty: "error" }`.

Impact: no runtime divergence — the code does not rely on the false claim. `content-schema`
sets the option explicitly and correctly ([C] `decode.ts:9,19,28`; `schema-validator.ts:6,22-24`),
and `persistence` intentionally accepts the default strip ([C] `store.ts` decodes with no option;
[G] `packages/persistence/test/schema-serialization.test.ts:109-156` locks it in; [C]
`schemas.ts:18-20` documents it). The finding is a **false rule in a normative policy doc** that
every agent reads, hence Blocker per the map's severity definition. **Remedy: doc** — correct
`agent-patterns/effect-idioms.md:27-29` and `ADR-0102 §4` to say "strips by default; pass
`onExcessProperty: "error"` to reject", cross-referencing ADR-0104 §3 / ADR-0105 §2 (which are
already right). No code change.

### F2 — the shared `Effect.succeed([])` decode default does **not** alias across these fields — **Info (accept; corrected by executable probe)**

The first reading here was that one shared `Effect.succeed([])` at
`packages/persistence/src/schemas.ts:50` would hand all five defaulted array
fields the same instance. An executable probe against the vendored runtime
**disproves** that for these schemas: `withDecodingDefaultType` on a
`Schema.Array` re-materialises a fresh array on every decode, so a shared
constant is not aliased.

- Probe (2026-10-13, run against the vendored `effect@4.0.2`): a `Schema.Struct`
  with two `Schema.Array(Schema.Unknown).pipe(Schema.withDecodingDefaultType(shared))`
  fields plus one `Schema.Array(Schema.Record(...))` field, decoded twice, yields
  `a !== b`, `a !== c`, and `x.a !== y.a` — every defaulted array a distinct
  instance; mutating one leaves the others (`[]`). Aliasing appears **only** for a
  non-array/opaque self: `Schema.Unknown.pipe(Schema.withDecodingDefaultType(shared))`
  gives `p === q`.
- [V] `vendor/effect/src/SchemaGetter.ts:1050-1057` (`SchemaGetter.withDefault` →
  `Effect.mapEager(defaultValue, Option.some)`) describes the *opaque* getter
  path, not the array re-decode path these schemas take — the first reading
  conflated the two.

All five defaulted fields are `Schema.Array(...)` ([C] `schemas.ts:58-66,85-87`),
so the shared constant is safe here and **no code change is warranted**. A future
**non-array mutable default** (`Schema.Unknown`, a mutable object) *would* alias
and must mint per use. **Remedy: accept.** No identity test is added: the
proposed guard passes identically before and after the "fix", so it could not
fail for the reason claimed — `RULES.md:113` (a bug is unconfirmed until an
observable regression test fails for the expected reason before the fix).

### F3 — passing an `Effect` to `withDecodingDefaultType` is the documented/required API; no plain-value alternative exists — **Info (accept)**

- [V] `vendor/effect/src/Schema.ts:6144-6145` — `withDecodingDefaultType(defaultValue: Effect.Effect<S["Type"], SchemaError, R>, options?)`.
- Every sibling default API also takes an `Effect`: `withDecodingDefaultTypeKey` (`Schema.ts:6032-6038`), `withDecodingDefault` (`:6092-6095`), `withConstructorDefault` (`:5909-5915`), `SchemaGetter.withDefault` (`SchemaGetter.ts:1050-1052`).
- `Schema.optionalWith` does **not** exist in `effect@4.0.2` (0 matches in `vendor/effect/src/Schema.ts`), confirming ADR-0104 §2's correction of ADR-0102's `.default` sketch.

So `Effect.succeed([])` is the documented/needed form. It is permitted because
`packages/persistence/src` is deliberately **not** a runtime-free root ([G]
`scripts/assert-runtime-free.mjs:37-54` lists the guarded roots; `persistence` is absent), and
ADR-0104 §6 records the deviation explicitly. `Effect.succeed` constructs a constant value and
never *runs* a runtime, so no runtime wave is implied. **Remedy: accept** (already documented);
the shared-constant concern raised under F2 did not reproduce. A hypothetical runtime-free
alternative would have to hand-roll a `SchemaGetter`/`decodeTo` transformation with a plain
constant — not a public idiom, and not worth it.

### F4 — the named filters are the idiomatic v4 form, and `makeFilter` is used correctly — **Info (accept); one Minor style note**

All filters in the ticket exist in [V] `vendor/effect/src/Schema.ts`:
`isInt` (`:7890`), `isMinLength` (`:8408`), `isMaxLength` (`:8487`), `isBetween` (`:7798`),
`isPattern` (`:6870`), `isGreaterThan` (`:7671`), `isGreaterThanOrEqualTo` (`:7702`),
`isLessThanOrEqualTo` (`:7764`), `isMinSize` (`:8738`), `isBetweenLength` (`:8538`), and
`makeFilter` (`:6742`). Authored usage (excluding `dist/`): `isInt` 55, `isMinLength` 39,
`isBetween` 25, `isGreaterThanOrEqualTo` 25, `isMaxLength` 16, `isGreaterThan` 13, `isPattern` 12,
`makeFilter` 11, `isLessThanOrEqualTo` 3, `isMinSize` 2, `isBetweenLength` 2.

`makeFilter` usage is correct: returning `undefined` for success and a `string` for failure matches
`FilterOutput` ([V] `Schema.ts:6772-6789`), and it is attached with `.check(...)` ([V] `Schema.ts:5164`);
see [C] `ship-component.ts:66,126,175-196`, `events/src/validation.ts:129-135`,
`combat/src/air-defense/attack.ts:71-80`. `Annotations.Filter.message` is a **string**
([V] `Schema.ts:17290`), so `{ message: "must be YYYY-MM" }` is valid and ADR-0105 §6 holds.
`isBetween` is called with the correct object form ([V] `Schema.ts:7798-7803`;
[C] `ship-component.ts:52`). **Remedy: accept.**

Minor (style): [C] uses `Schema.Finite.check(Schema.isInt(), …)` where an integer schema is wanted
(e.g. `ship-component.ts:49-52`). The vendored `Schema.Int` constant is exactly
`Number.check(isInt())` and already rejects `NaN`/`Infinity` ([V] `Schema.ts:7890-7925`), so
`Schema.Int` is the more idiomatic spelling and is semantically equivalent. Not a correctness
issue (the explicit `Finite` also satisfies ADR-0104 §1's Zod-parity rule). **Remedy: optional
style** — prefer `Schema.Int`, or leave as-is and accept.

### F5 — `SchemaIssue.makeFormatterStandardSchemaV1` is the right sink — **Info (accept)**

- [V] `vendor/effect/src/SchemaIssue.ts:1303-1310` — returns a `Formatter<StandardSchemaV1.FailureResult>` producing `{ issues: [{ path, message }] }`.
- [V] `vendor/effect/src/SchemaIssue.ts:1291-1292` — documented example: `formatter(new SchemaIssue.MissingKey(undefined)).issues[0].message // => "Missing key"`, which [C] `schema-validator.ts:32` relies on.
- [V] `vendor/effect/src/internal/schema/standardSchema.ts:35` — the canonical internal consumer (`toStandardSchemaV1`) uses the same formatter.
- [V] `vendor/effect/src/Schema.ts:1204-1205` — `SchemaError` carries `readonly issue: SchemaIssue.Issue`, which [C] `schema-validator.ts:24` reads as `result.failure.issue`.

The path/message projection and the `"Missing key"` remediation guard are consistent with the
vendored API. **Remedy: accept.**

### F6 — never using `Schema.TaggedError` is consistent with the reachability rule — **Info (accept)**

`Schema.TaggedError` builds a **schema-backed** (wire/serializable) error class; `Data.TaggedError`
does not.

- [V] `vendor/effect/src/Schema.ts:16030-16035` — `Schema.TaggedError` returns `Class<Self, TaggedStruct<Tag, Fields>, Cause_.YieldableError & Brand>` (impl `:15930-15946` via `makeClass`, i.e. carries a codec).
- [V] `vendor/effect/src/Data.ts:1124-1128` — `Data.TaggedError` returns `Cause.YieldableError & { readonly _tag: Tag } & Readonly<A>` (no schema/codec).
- [P] `docs/adr/ADR-0152-errors-by-reachability.md` §1-2 — non-renderer-reachable packages use `Data.TaggedError`; renderer-reachable packages use plain classes with `readonly _tag`. Either way, in-process errors do not use `Schema.TaggedError`.
- [P] ADR-0104 §3 (Alternatives) explicitly rejects `Schema.TaggedError` for in-process errors as "wire codec machinery the boundary does not use".
- [C] authored tree: `Data.TaggedError` in 22 files; `Schema.TaggedError` appears **only in comments** explaining why it is not used (e.g. `packages/persistence/src/errors.ts:8`).

**Remedy: accept.** (The deeper tagged-error audit belongs to ticket 02.)

### F7 — ADR-0102 §5's conceptual mapping table uses stale v3 API names — **Minor (doc)**

[P] `docs/adr/ADR-0102-replace-zod-with-effect-schema.md:42-52` maps to `Schema.pattern`,
`Schema.int`, `Schema.between`, `Schema.transform`, `Schema.filter`, and `Schema.optionalWith`.
None of these exist in `effect@4.0.2` (0 matches each in [V] `vendor/effect/src/Schema.ts`); the
real names are `isPattern` / `isInt` / `isBetween` / `makeFilter` / `withDecodingDefaultType`.
ADR-0104 §2 and ADR-0105 §6 already correct the `.default` and filter forms, but the table still
reads as authoritative. **Remedy: doc** — label §5 as conceptual and point to the corrected v4
names (or amend).

### F8 — `decodeUnknownResult` is not total on non-schema causes — **Info (accept / note)**

[V] `vendor/effect/src/Schema.ts:1704-1706` — "Only causes made entirely of schema issues are
returned as `Result.fail`. Causes that contain defects, interruptions, or other non-schema reasons
throw instead." The authored helpers treat it as total ([C] `decode.ts:27-28`,
`schema-validator.ts:22-23`, `store.ts:398,422`). For structural decode of plain JSON there are no
defect/interruption sources, so this is safe today. **Remedy: accept**; ticket 03 owns the
Result-boundary-decode audit.

## Verdict per target

| # | target | verdict | severity |
| --- | --- | --- | --- |
| 1 | boundary decode helpers (`decode.ts`, `schema-validator.ts`, `store.ts`) | conformant; options placement correct; `decodeUnknownResult` non-total caveat noted | Info |
| 2 | closed-struct assumption | **vendored truth: strips by default**; idiom doc + ADR-0102 §4 are wrong; ADR-0104/0105 correct | **Blocker** (false rule) |
| 3 | filters (`is*`, `makeFilter`) | exist and are idiomatic; `makeFilter` correct; `Annotations.Filter.message` is `string` | Info (+Minor style) |
| 4 | decode defaults | `Effect` is the required API; the shared constant does **not** alias these array fields (probed) | Info |
| 5 | `SchemaIssue.makeFormatterStandardSchemaV1` | correct sink | Info |
| 6 | `Schema.TaggedError` vs `Data.TaggedError` | unused is correct under the reachability rule | Info |

## Recommendations

- **Doc (F1, Blocker):** fix `agent-patterns/effect-idioms.md:27-29`, `ADR-0102 §4`, and
  `RULES.md:74` to state that `Schema.Struct` **strips** excess keys by default and that
  rejection requires `{ onExcessProperty: "error" }`; cross-reference ADR-0104 §3 / ADR-0105 §2;
  also strike ADR-0104 §3's unsupported "JSON-Schema emission default" rationalization.
  (The same idioms-doc `Schema` section also named the non-existent `Schema.optionalWith`.)
- **Accept (F2, F3, F4, F5, F6, F8):** the shared `Effect.succeed([])` is not
  aliased by `Schema.Array` defaults (probed — a future *non-array* mutable default
  would need per-use minting), the Effect-typed default API, the filter set/`makeFilter`,
  the Standard Schema formatter, the `Data.TaggedError`-only choice, and the
  `decodeUnknownResult` caveat are all conformant/documented.
- **Doc (F7, Minor):** annotate/amend ADR-0102 §5's conceptual mapping to the real v4 names.
- **Ticket hygiene (Info):** the ticket's attribution of the "closed" claim to
  `01_schema/10_schema-basics.ts` is wrong — the claim is in `effect-idioms.md`, `ADR-0102 §4`,
  and `RULES.md:74`.

## Deferred

- The executable probe that pins the strip-vs-reject behaviour is ticket 04's deliverable
  (`.scratch/effect-conformance/issues/04-…`); this note is source-reading plus the F2 probe.
- The remediation *shape* for F1 (whether the code, the doc, or both change) is explicitly
  "Not yet specified" in the map and graduates once tickets 01–04 report. *(Resolved: the F1
  remedy is doc-only; the F2 code remedy is withdrawn — the probe shows no aliasing.)*
- Whether the F1 false rule warrants a ratchet gate (ADR-0106 family) vs a doc/ADR statement is
  the map's open question, not decided here.
- Ticket 02 owns the full `Data.TaggedError` / reachability audit; ticket 03 owns the
  Result-boundary decode audit.
