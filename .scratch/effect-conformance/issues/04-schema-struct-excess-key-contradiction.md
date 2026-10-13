# Resolve Schema.Struct excess-key contradiction (probe)

**Type:** prototype
**Status:** resolved
**Blocked by:** none

## Question

`agent-patterns/effect-idioms.md` claims "`Schema.Struct` is closed by default (excess
keys rejected), matching Zod `.strict()`." ADR-0104 §3 and ADR-0105 §2 claim the
opposite: `Schema.Struct` **strips** excess keys on decode, and strict rejection comes
only from the `{ onExcessProperty: "error" }` decode option. At most one is true.

Build a cheap, executable probe under `prototype/` (or `.scratch/`) against the
vendored `vendor/effect` to settle the real `effect@4.0.2` behaviour:

1. Decode `{a, extra}` through a plain `Schema.Struct({a})` — is `extra` stripped,
   kept, or rejected?
2. Same with `{ onExcessProperty: "error" }` — rejected?
3. Confirm against vendored `packages/effect/src/Schema.ts` and its tests.

Then decide the disposition: fix the code, fix the doc (`effect-idioms.md`), fix the
ADRs, or some combination — recording which authority (vendored behaviour) proved it.
Record the probe as an asset linked from this ticket.

## Answer

**Settled (2026-10-13) by executable probe.** Authority = vendored behaviour:
`vendor/effect` is byte-identical to the `effect@4.0.2` npm tarball (`UPSTREAM.md`),
and the probe imports `vendor/effect/dist/index.js` — exactly what a consumer of the
workspace `effect` package loads. Durable write-up:
`docs/research/effect-conformance-04-schema-struct-excess-key.md`. Throwaway probe (run
from repo root):

```
node .scratch/effect-conformance/probe/excess-key-probe.mjs
```

`ALL CHECKS PASSED` (6/6); each case prints actual + expected:

1. `Schema.decodeUnknownSync(Schema.Struct({a: String}))({a, extra, third, [sym]})`
   → `{ a: "a" }` — excess keys (string **and** symbol) are **stripped**, not kept,
   not rejected. Default is `onExcessProperty: "ignore"`.
2. Same with explicit `{ onExcessProperty: "ignore" }` → stripped.
3. `{ onExcessProperty: "error" }` → **rejected**: throws
   `"Expected no excess property\n  at [\"extra\"]"`; `decodeUnknownResult` returns
   `Result.fail` (not a defect throw); a *declared* symbol key is covered, not excess.
4. `Schema.toJsonSchemaDocument(Struct)` emits `"additionalProperties": true` — the
   JSON-Schema emission default is **open** too.

Vendored source/tests corroborate: `vendor/effect/src/SchemaAST.ts:490` and `:526-539`
(`@default "ignore"`: "strips unspecified properties from the output"); the
`UnexpectedKey` rejection loop at `:3015-3045` runs **only** under
`options.onExcessProperty === "error"`; `vendor/effect/src/Schema.ts:16324`
("The default `onExcessProperty: "ignore"` matches the decoder default");
`repos/effect/packages/effect/test/schema/Schema.test.ts:637-678` (`error` rejects
with "Expected no excess property"; `ignore` strips string + symbol keys).

**Verdict: the contradiction is between a *false rule* and the truth.**
`Schema.Struct` is **open by default (strips)**; strict rejection needs
`{ onExcessProperty: "error" }`. ADR-0104 §3 and ADR-0105 §2 were **correct**;
`effect-idioms.md` and ADR-0102 §4 were wrong.

**Disposition: doc-only, already applied by ticket 01 and now confirmed executably.**

- `agent-patterns/effect-idioms.md:29-32`, `docs/adr/ADR-0102-replace-zod-with-effect-schema.md:40`,
  and `RULES.md:79-81` already read "strips by default; pass
  `{ onExcessProperty: "error" }` to reject". No further authority change needed.
- **No code change.** The authored tree never relied on the false rule: the strict
  boundaries set the option explicitly (`content-schema/src/decode.ts:9`,
  `schema-validator.ts:6`) and the strip boundaries intentionally take the default
  (`persistence/src/store.ts`, `schemas.ts:18-20`).
- Residual nits fixed in this session: the self-contradictory test title
  `packages/persistence/test/schema-serialization.test.ts:109` ("closed Struct strips")
  → "open Struct strips"; and the now-stale citations in
  `docs/research/effect-conformance-03-result-boundary.md` §F5.
- **Ticket 03 F5's "align every boundary decoder to one policy constant" remedy is
  withdrawn:** the strict/strip split mirrors the pre-migration Zod `.strict()` vs open
  `z.object` split exactly. The strip-sites were open `z.object` pre-migration — the three
  `combat` contract files at `5df46569^` and the desktop IPC decoder
  (`campaignBridge.ts` + `campaignCommandSchemas.ts`) at `0c7370d4^` (the main-process IPC
  migration) — each 0 `.strict()`; the `air-defense` group (migrated at `5df46569`)
  carried `.strict()` and now passes the option. Unifying would break parity rather than
  restore it.

The durable asset is `docs/research/effect-conformance-04-schema-struct-excess-key.md`;
the `.scratch/` probe is throwaway and linked from it.
