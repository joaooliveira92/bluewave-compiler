# Research: `Schema.Struct` excess-key behaviour (`effect@4.0.2`) — ticket 04

Research-only note (ticket `.scratch/effect-conformance/issues/04-schema-struct-excess-key-contradiction.md`).
Settles an executable contradiction between the repo's false rule ("`Schema.Struct` is
closed by default") and ADR-0104 §3 / ADR-0105 §2 ("strips by default; reject with
`{ onExcessProperty: "error" }`"). Authority, per the map: the **vendored** artifact is
evidence-of-truth. Captured 2026-10-13.

## Question

At most one of the two claims is true. Which does `effect@4.0.2` actually do?

1. Decode `{a, extra}` through a plain `Schema.Struct({a})` — is `extra` stripped, kept,
   or rejected?
2. Same with `{ onExcessProperty: "error" }` — rejected?
3. Confirm against vendored `packages/effect/src/Schema.ts` and its tests.

## Sources

| tag | source | status |
| --- | --- | --- |
| [V] | `vendor/effect` (`dist/` + `src/SchemaAST.ts`, `src/Schema.ts`), byte-identical to the npm `effect@4.0.2` tarball (`UPSTREAM.md`) | authoritative |
| [T] | `repos/effect/packages/effect/test/schema/Schema.test.ts` | corroborating (subtree HEAD) |
| [P] | policy `agent-patterns/effect-idioms.md`, `RULES.md`, `docs/adr/ADR-0102/0104/0105` | policy of record |
| [X] | probe `.scratch/effect-conformance/probe/excess-key-probe.mjs` (throwaway, run from repo root) | executable evidence |

## Method

`node .scratch/effect-conformance/probe/excess-key-probe.mjs` — the probe imports
`vendor/effect/dist/index.js`, exactly what a consumer of the workspace `effect` package
loads (`import { Schema } from "effect"`). Result: **`ALL CHECKS PASSED` (6/6)**.

## Findings

### The rule: `Schema.Struct` is **open by default (strips)**; rejection needs `{ onExcessProperty: "error" }` — settled

Probe output (actual ≡ expected on every line):

| # | case | result |
| --- | --- | --- |
| 1 | default decode of `{a, extra, third, [sym]}` | `{ a: "a" }` — string **and symbol** excess keys stripped (own-key set `{strings:["a"], symbols:[]}`), not kept, not rejected |
| 2 | explicit `{ onExcessProperty: "ignore" }` | identical to the default |
| 3 | `{ onExcessProperty: "error" }` | **rejected**: throws `Expected no excess property\n  at ["extra"]` |
| 3b | `decodeUnknownResult(..., { onExcessProperty: "error" })` | `Result.fail` (not a defect throw) |
| 3c | declared symbol key under `"error"` | covered, not excess → success |
| 4 | `Schema.toJsonSchemaDocument(Struct)` | `"additionalProperties": true` — the JSON-Schema emission default is open too |

Vendored source confirms the mechanism:

- [V] `vendor/effect/src/SchemaAST.ts:490` — `onExcessProperty` — `"ignore"` (default)
  strips unknown object keys; `"error"` fails.
- [V] `vendor/effect/src/SchemaAST.ts:526-539` — `@default "ignore"`: "strips unspecified
  properties from the output. Use `"error"` to fail when an excess property is present."
  This is the `ParseOptions` type consumed by `Schema.decodeUnknown*`.
- [V] `vendor/effect/src/SchemaAST.ts:3006` + `:3015-3045` — the `UnexpectedKey`
  rejection loop runs **only** under `options.onExcessProperty === "error"`.
- [V] `vendor/effect/src/Schema.ts:16233` (`ToJsonSchemaOptions.onExcessProperty`) and
  `:16324` — "The default `onExcessProperty: \"ignore\"` matches the decoder default."
- [T] `repos/effect/packages/effect/test/schema/Schema.test.ts:637-678` — `"error"`
  rejects with "Expected no excess property" (string and symbol keys); `"ignore"`
  decodes `{a,b,c,[sym]}` to `{ a: "a" }`.

### Disposition — **doc-only; already applied by ticket 01**

The false rule lived in [P] `agent-patterns/effect-idioms.md`, `ADR-0102 §4`, and
`RULES.md`, and was corrected by ticket 01 to "strips by default; pass
`{ onExcessProperty: "error" }` to reject". This probe confirms those corrected texts and
the mechanism, so:

- **No code change.** The authored tree never relied on the false rule:
  `content-schema` sets the option explicitly (`src/decode.ts:9`, `schema-validator.ts:6`)
  and `persistence` intentionally takes the strip default (`src/schemas.ts:18-20`,
  `src/store.ts`).
- Residual nit fixed this session: the self-contradictory test title in
  `packages/persistence/test/schema-serialization.test.ts:109` ("closed Struct strips")
  now reads "open Struct strips".

### Ticket 03 F5's "align decoders to one policy constant" remedy — **withdrawn**

The strict/strip split documented in `effect-conformance-03-result-boundary.md` §F5 is
**faithful pre-migration parity**, not a divergence. The pre-migration Zod schemas carried
`.strict()` only where the Effect migration now passes the option:

- `packages/combat/src/air-defense/*` were `.strict()` (migration `5df46569`) → decode
  with `{ onExcessProperty: "error" }`.
- `packages/combat/src/{air-combat,aircraft,carrier-operations}/contracts.ts` were open
  `z.object` — **0 `.strict()` at `5df46569^`** → decode with no options (strip).
- `apps/desktop/src/main/campaignBridge.ts` / `campaignCommandSchemas.ts` were open
  `z.object` — **0 `.strict()` at `0c7370d4^`** (the main-process IPC migration commit) →
  default `withSchema` strips; only `withStrictSchema` (used solely for
  `placeForeignConstructionCommand`) rejects.

Unifying every boundary on one constant would *break* parity (weaken the `.strict()`
boundaries or newly reject at formerly-open ones). The lever is per-schema parity,
documented at each site. Ratified as `docs/adr/ADR-0155-per-schema-excess-key-strictness.md`.

## References

- Ticket 04: `.scratch/effect-conformance/issues/04-schema-struct-excess-key-contradiction.md`
- Ticket 01 (corrected the false docs): `docs/research/effect-conformance-01-schema.md` §F1
- Ticket 03 (F5 remedy withdrawn): `docs/research/effect-conformance-03-result-boundary.md` §F5
