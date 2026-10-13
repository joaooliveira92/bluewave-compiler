# ADR-0102: Replace Zod with Effect Schema

## Status

Accepted (2026-10-11).

## Context

Validation today is a single root `zod` devDependency used at three kinds of
boundary: content compilation, persistence saves, and Electron IPC/event
envelopes. ADR-0100 adopts Effect v4, where `Schema` is the native validator and
is runtime-free for synchronous decode/encode. Maintaining Zod and Effect Schema
side by side for the same shape creates two sources of truth for one wire
contract, and the repo's hard rule is that **persisted and cross-process wire
formats must stay byte-compatible** (ADR-0023, ADR-0024).

## Decision

1. **Effect Schema becomes the single validator at every boundary.** Each
   boundary migrates **in place in one coherent step**: the Effect Schema
   definition becomes the single source of truth and the equivalent Zod
   definition is deleted in the same change. Zod and Effect Schema definitions
   for the same shape are **never** maintained simultaneously.
2. **No bridge is shipped.** Zod is validation-only here; there are no
   downstream Zod consumers, so no generic Schema→Zod adapter is introduced.
3. **Boundary list** (all Zod sites): `content-schema` (area/design/manifest/
   nation/naval-profile/naval-profile-vocab/port/possession/route/ship-component/
   technology plus the type-only `schema-validator`), `events/validation`,
   `content-compiler/stages/validate` (type-only `ZodSchema`),
   `campaign-engine/priorities`, `persistence/schemas`, the `combat`
   `*-contracts` (air-combat, aircraft, carrier-operations, air-defense) plus
   air-defense attack/system-definition schemas, and the desktop `src/main`
   schemas (campaignBridge, campaignCommandSchemas, campaignSaveSchema,
   campaignSessionMetadata, drawingBoardDraft, monthInput, pendingCommands).
4. **Wire formats are frozen.** Save packs, IPC envelopes, event envelopes, and
   compiled content keep exactly their existing bytes. Every schema change
   carries a **parity test built from the existing Zod fixtures**, because
   default/optional/strict semantics differ subtly between Zod and Schema (e.g.
   default arrays, excess-property rejection, refinement ordering).
   `Schema.Struct` **strips** excess keys by default in v4
   (`onExcessProperty: "ignore"`, matching non-strict `z.object`); rejection
   requires passing `{ onExcessProperty: "error" }` at decode. Parity is
   verified per schema (see ADR-0104 §3, ADR-0105 §2), not assumed.
5. **Conceptual API mapping** (Zod → v4 names; conceptual only, not a 1:1
   function export — the corrected `.default` and refinement/filter forms are in
   ADR-0104 §2 and ADR-0105 §6): `z.object`→`Schema.Struct`;
   `z.array`/`z.record`→`Schema.Array`/`Schema.Record`;
   `z.literal`/`z.enum`→`Schema.Literal`/`Schema.Literals`;
   `.optional`/`.nullable`→`Schema.optional`/`Schema.NullOr`;
   `.default(v)`→`Schema.withDecodingDefaultType(Effect.succeed(v))` (v4 removed
   `optionalWith({ default })`); `.regex`→`Schema.isPattern`;
   `.int`→`Schema.isInt` (or the `Schema.Int` constant); string `.min`/`.max`→
   `Schema.isMinLength`/`Schema.isMaxLength`; numeric `.min`/`.max`→
   `Schema.isBetween`/`Schema.isGreaterThan`/`Schema.isGreaterThanOrEqualTo`
   attached with `.check(...)`; `.transform`/`.refine`/`.superRefine`→
   `Schema.decodeTo`/`Schema.encodeTo` plus `Schema.makeFilter`;
   `z.discriminatedUnion`→`Schema.Union` of tagged `Schema.Struct`s;
   `safeParse`→`Schema.decodeUnknownResult`; `parse`→`Schema.decodeUnknownSync`;
   `z.infer`→`typeof S.Type` (the v4 idiom); the `ZodSchema` type→
   `Schema.Schema<A, I, R>`. In-process errors stay `Data.TaggedError`; wire
   errors become `Schema.TaggedError`.
6. **`zod` is removed last.** The root `zod` devDependency and every package
   `zod` dependency are deleted only after the final boundary and all transitive
   consumers migrate.

## Consequences

- One validator idiom across compiler, engine, persistence, and desktop main;
  pure packages stay runtime-free (`Schema` sync decode needs no `Effect`).
- Wire compatibility is protected by per-schema parity tests rather than by
  hope.
- The migration is wave-gated (Wave 2), so no boundary is half-converted and
  `zod` never lingers as a second source of truth.

## Alternatives considered

- **Dual-maintain Zod and Schema.** Rejected: two sources of truth for one wire
  shape risks silent divergence and violates the no-dual-maintenance rule.
- **Ship a Schema→Zod bridge.** Rejected: no downstream Zod consumer exists;
  the bridge is pure maintenance cost.
- **Big-bang conversion of every boundary in one step.** Rejected: too large to
  review and roll back; boundaries convert independently under one atomicity
  rule.
- **Change wire formats "while we are here".** Rejected: breaks saves and IPC;
  wire-format preservation is the one hard rule.

## Related

- ADR-0005 (content parsing and schema validation), ADR-0023 / ADR-0024
  (save-integrity contracts).
- `agent-patterns/effect-idioms.md` — Schema idioms and the runtime-free subset.
