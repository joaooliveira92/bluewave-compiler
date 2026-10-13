# ADR-0143: Complete content-schema coverage and decode the artifact at its boundary

## Status

Accepted (2026-10-12).

## Context

ADR-0105 made `@bluewave/content-schema` the single strict boundary for content:
`Effect.Schema` structs decoded with `onExcessProperty: "error"` so an excess or
misspelled key is rejected. ADR-0122/0124 then compiled the full authored surface
— content-pack collections, the ship-building catalogue and the six campaign-file
collections — into one hash-pinned artifact.

Two seams stayed open. The **reference designs** and the six **campaign-file
collections** had no content schemas: they were only duplicate-ID checked and
cross-referenced by hand-written passes, so a structurally malformed fleet,
economy, research programme, design or reference design could still compile. And
the runtime artifact boundary **asserted** the decoded bundle's shape
(`as unknown[]`, `as unknown as ContentPack`) instead of decoding it, so
schema/artifact drift would be a silent runtime surprise rather than a
fail-closed error.

## Decision

1. **Every authored collection is schema-validated through the strict validator.**
   New `Effect.Schema` structs join `@bluewave/content-schema`:
   `ReferenceDesignSchema` (the drawing-board draft shape), and
   `CampaignFleetSchema` / `CampaignEconomySchema` / `CampaignConstructionSchema`
   / `CampaignResearchSchema` / `CampaignDesignSchema` / `CampaignDiplomacySchema`.
   `CampaignDesignSchema` spreads `DesignTemplateSchema.fields` and adds the
   campaign-only version and family fields. The compiler's validate stage routes
   both families through the same per-collection loop it already uses for the
   ship-building collections, preserving the existing duplicate-ID and
   cross-file reference checks. Missing required fields, wrong-typed fields and
   excess keys each fail with a `SCHEMA` diagnostic naming the source file and
   field path.
2. **The artifact boundary decodes, never asserts.** A `ContentBundleSchema` in
   `@bluewave/content-schema` reuses each collection's strict schema plus the
   manifest and the optional `shipBuilding`/`campaign` sections.
   `verifyContentBundleArtifact` decodes the hash-verified bundle through it;
   a bundle that verifies by hash but no longer matches the schema fails closed
   with the stable code `CONTENT_ARTIFACT_SCHEMA_MISMATCH`. The
   `as unknown as ContentPack` assertion at the compile-stage view is gone, so
   the `no-unknown-casts` baseline shrank.

## Consequences

- A structurally malformed record in any authored collection is rejected before
  it can reach the artifact; the strict validator is the one home for
  "structurally valid is not necessarily valid content".
- Schema/artifact drift is a hard, named failure, not a cast that hides it.
- Production re-decodes cleanly because the compiler stored the *decoded*
  collections; validation-only wiring does not move the artifact body hash.
- The ship-building `balance` mapping stays opaque (`Schema.Unknown`); it is
  free-form authored data the compiler does not structure.

## Related

- ADR-0004 (compiler stages), ADR-0005 (strict content parsing), ADR-0105
  (content-schema Effect boundary), ADR-0106 (frozen-quality ratchets),
  ADR-0122/0124 (compiled content bundle and campaign collections).
