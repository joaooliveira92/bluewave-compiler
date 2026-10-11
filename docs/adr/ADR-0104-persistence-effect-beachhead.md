# ADR-0104: `persistence` Effect beachhead — Schema save boundary + tagged errors

## Status

Accepted (2026-10-11).

## Context

ADR-0100 permits the full Effect runtime at IO/infrastructure boundaries, ADR-0101
vendors exactly one pinned Effect v4, and ADR-0102 replaces Zod with Effect Schema
boundary-by-boundary with a frozen wire format. Adoption ticket 06 selected
`@bluewave/persistence` (`SaveStore` / `RecoveryManager` / `CompatibilityChecker`
and `snapshotSerialization`) as the first real boundary to adopt Effect, because it
is IO-bound, error-heavy, owns the envelope/serializer, and proves the riskiest
facts — Effect values surviving `canonicalSerialize`, and existing saves staying
loadable — in one contained package upstream of the desktop app.

The package had two idioms to settle: a `zod` schema layer validating every
on-disk artifact, and a throw + `DiagnosticCollector` mix for failures. The wire
shape (`campaign.json`, `campaign.sig.json`, `metadata.json`, `pointer.json`,
`month-input.json`) is frozen and must stay byte-compatible (ADR-0032).

## Decision

1. **Effect Schema owns the save boundary.** `packages/persistence/src/schemas.ts`
   (plus the decode sites in `store.ts` / `recovery.ts`) migrated from Zod to
   Effect `Schema` with the ADR-0102 mapping: `z.object`→`Schema.Struct`,
   `z.record`→`Schema.Record`, `z.array`→`Schema.Array`, `z.string`/
   `z.unknown`→`Schema.String`/`Schema.Unknown`, **`z.number`→`Schema.Finite`**
   (Zod v4's `z.number()` rejects `NaN`/`Infinity`/`-Infinity`; `Schema.Number`
   would accept them, so parity requires `Schema.Finite`),
   `.optional`→`Schema.optional`, `z.infer`→`typeof S.Type`, `safeParse`→
   `Schema.decodeUnknownResult`, `parse`→`Schema.decodeUnknownSync`. The `zod`
   dependency is removed from `packages/persistence/package.json`; no Zod
   definition is retained (atomic migration, MIG-ZOD-1). The `z.number` →
   `Schema.Finite` correction is enforced by a non-finite-rejection parity test.
2. **`.default([])` mapping (v4 deviation from ADR-0102's sketch).** Effect v4
   removed Zod's `optionalWith({ default })`; the official migration mapping is
   `Schema.withDecodingDefaultType(Effect.succeed(v))`. The five defaulted
   arrays (`slots`, `world.areas`/`routes`/`ports`, `strategicWeather`) use it,
   which reproduces Zod's "key absent or `undefined` → default" semantics
   exactly.
3. **`Schema.Struct` excess-key parity is empirically verified, not assumed.**
   In `effect@4.0.2` a `Schema.Struct` **strips** unmodeled keys on decode by
   default (it does not reject them), matching the non-strict `z.object` default
   the package used. A focused parity test locks this in. (The spec/idiom note
   "Struct is closed by default" describes the JSON-Schema emission default, not
   the decoder; the decoder's real behavior is what the parity test pins.)
4. **Mutable decoded types are preserved.** Effect Schema's `.Type` is deeply
   readonly, but Zod's `z.infer` produced mutable shapes and an existing caller
   tampers a parsed `SigFile`. The exported aliases (`SaveMetadata`, `SigFile`,
   `PointerFile`, `StorableCampaignState`, `DecodedSaveHeader`) are mapped to
   mutable forms; the decoded runtime value is already plain mutable JavaScript,
   so this is a type-level restatement, not a behavior change.
5. **Tagged `PERSISTENCE_*` errors are added, not substituted.** The five codes
   (`PERSISTENCE_CORRUPT_SAVE`, `PERSISTENCE_MISSING_SAVE`, `PERSISTENCE_CANCELLED`,
   `PERSISTENCE_UNSIGNED_SAVE`, `PERSISTENCE_COMPATIBILITY_MISMATCH`) now exist as
   in-process `Data.TaggedError` classes in `packages/persistence/src/errors.ts`,
   each with its `_tag` equal to the code string so a later wave can `yield*` /
   `Effect.catchTag` it. They are **not** `Schema.TaggedError`: they never cross a
   wire/serialization boundary (ADR-0100 §3). `toDiagnostic()` projects a tagged
   error onto exactly the `Diagnostic` the collector already accepted, keeping
   collector output byte-identical. **The `DiagnosticCollector` public contract is
   retained** (adoption ticket 06, plan §8 risk 11): the collector remains the
   public error surface and the `DiagnosticCode` constants still drive it.
6. **Runtime scope: raw synchronous IO is kept.** The public `SaveStore` API is
   synchronous (`save`/`load`/`loadById`/`list`/`isCurrent`/…), and hard
   constraint #2 requires it stays so. Converting `node:fs` to the async Effect
   `platform` FileSystem service would force an async facade and break the API, so
   the IO implementation and its atomic `tmp→rename→pointer` semantics are
   unchanged. The beachhead adopts the runtime-free-safe Effect pieces at the
   boundary (`Schema`, `Data.TaggedError`, `Result`) plus `Effect.succeed` for
   schema decoding defaults. A future wave may introduce a runtime behind the
   facade without changing the wire or the synchronous controls.
7. **Wire shape frozen and proven.** Existing saves still load (the
   compatibility/recovery/corruption suites are the contract); a focused MIG-WIRE-4
   test decodes the real `campaign.json` with the new Effect Schema and asserts
   `canonicalSerialize` produces identical bytes, the envelope/rawHash gates pass
   over the decoded value, and the save reloads loadably.

## Consequences

- The save boundary has one validator idiom and a typed error vocabulary, while
  the collector-based public surface, abort semantics (`error.name ===
  "AbortError"`), and on-disk bytes are unchanged.
- `@bluewave/persistence` now depends on the vendored `effect` workspace package
  (single-copy guard green); `zod` is gone from the package but remains the root
  devDependency until Wave 2 removes the last boundary.
- Golden hashes are unchanged (10/10) — the save path is not a hash surface and
  the schema swaps no bytes.
- **The throw + `DiagnosticCollector` mix is intentionally retained for this
  wave** (adoption ticket 06 deferred the collector-contract decision): the
  tagged `PERSISTENCE_*` classes are the preparatory typed vocabulary, and a
  later wave may route the remaining `SaveStore` failure sites through them
  without touching the wire shape or the synchronous public API.

## Alternatives considered

- **Async Effect `platform` FileSystem rewrite.** Rejected: it would break the
  synchronous `SaveStore` API and the abort/rollback semantics the caller relies
  on, for no observable benefit at this boundary.
- **`Schema.TaggedError` instead of `Data.TaggedError`.** Rejected: these errors
  are in-process and never serialized; `Schema.TaggedError` would add wire codec
  machinery the boundary does not use (ADR-0100 keeps the in-process/wire split).
- **Replace the `DiagnosticCollector` with tagged errors in the public API.**
  Rejected: adoption ticket 06 deferred that decision and the hard constraint is
  that the tagged errors are additive; the collector stays the public surface.
- **Make `.Type` (readonly) the exported types.** Rejected: it silently breaks an
  existing mutable caller and is not required by Effect Schema.
- **Dual-maintain Zod and Schema during the swap.** Rejected by ADR-0102's
  atomicity rule.

## Related

- ADR-0100 (adopt Effect v4), ADR-0101 (vendor Effect), ADR-0102 (replace Zod with
  Effect Schema), ADR-0032 (persistence save-integrity contract). This ADR
  supersedes the passing "Zod `StorableCampaignStateSchema`" reference in
  ADR-0032 §5 — the schema is now Effect Schema (same acceptance contract).
- `.scratch/effect-v4-vendor-migration/issues/06-persistence-beachhead.md`,
  `.scratch/effect-v4-adoption/issues/06-beachhead-selection.md`.
- `agent-patterns/effect-idioms.md`.
