# ADR-0147: Machine-checked provenance and a placeholder release gate

## Status

Accepted (2026-10-12).

## Context

Provenance and confidence lived in two places that no build could act on: YAML
comments inside authored content (`# ESTIMATE`, `# PLACEHOLDER BALANCE TARGET`)
and "replace before release" lists in READMEs. The ship-building catalogue
already carried a structured `ProvenanceSchema` on some collections, but the
core content-pack collections and the campaign-file collections did not, and
nothing failed a build when an invented number reached a shipping pack.

An artifact hash and a committed lock (ADR-0145) prove *which* bytes ship; they
say nothing about whether those bytes are sourced or placeholder.

## Decision

1. **Provenance/confidence is a schema field.** `ProvenanceSchema` is extracted
   into `@bluewave/content-schema`'s `provenance.ts` and attached as an optional
   `provenance` field on every authored record collection — the core
   content-pack collections (`nations`, `areas`, `routes`, `possessions`,
   `ports`, `technologies`, `rulesets`), the ship-building collections that
   lacked it (`components`, `plants`, `hullForms`, `referenceDesigns`), and all
   six campaign-file collections. The field is schema-checked with the same
   strict excess-key policy; an unknown confidence or source status is rejected
   with the file and field path.
2. **`content:check` reports confidence per collection.** `countConfidence`
   walks the compiled bundle and emits, per collection, the counts of `HIGH`,
   `MEDIUM` and `LOW` provenance records (including nested ones), so a designer
   can see what is still an estimate without reading comments.
3. **A release gate fails unresolved placeholders.** `checkPlaceholderGate`
   walks the compiled bundle for provenance records whose `sourceStatus` is
   `PLACEHOLDER`. `content:gate` enforces it for **shipping (production)** packs:
   an unresolved placeholder fails with the collection, record and field named,
   unless the exact triple is on the committed, justified
   `placeholder-allowlist.json`. A non-production pack is skipped, and the gate
   runs in `pnpm preflight` so local green implies CI green.

The field is optional (absence means "no claim recorded yet"); the gate is only
about a *declared* placeholder. Migrating every comment-only estimate in the
production corpus into the field is content-authoring work that lands with the
value's research, not this mechanism.

## Consequences

- The release gate is mechanical: an invented number cannot ship once it is
  declared a placeholder, and admitting one requires a recorded justification.
- Adding an optional field does not move the production artifact body hash while
  no authored value sets it; the content lock (ADR-0145) stays valid.
- `ProvenanceSchema`'s home moved to `provenance.ts`; the naval-profile schema
  imports it rather than defining it, so armament and every new collection share
  one shape.
- The `balance` mapping stays opaque (`Schema.Unknown`), so its comment-only
  placeholder balance targets are not gated; converting those to structured
  provenance is a separate content decision.

## Related

- ADR-0005 (strict content parsing), ADR-0105 (content-schema Effect boundary),
  ADR-0106 (frozen-quality ratchets), ADR-0122 (compiled content bundle),
  ADR-0145 (committed content lock and `content:verify`).
