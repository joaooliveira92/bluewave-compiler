# ADR-0037: Normalize Authored Design Units at Compile

## Status

Accepted 2026-08-17

## Context

A content audit (`docs/research/content-5-1880-pack-audit-2026-08-17.md`) applied
`designVersionId` to the production pack's ships and then exercised the tactical
promotion path (`promoteTacticalUnit`, `@bluewave/combat`). Every promotion
failed with `INVALID_SHIP_TYPE` ("armor below family minimum"). Root cause: a
repo-wide unit mismatch between the design-authoring layer and the compiled-design
contract.

- `designs.yaml` (and every design fixture in the repo, e.g.
  `packages/campaign/test/campaign.test.ts:557-559`) authors `armorBeltUm` and
  `mainGuns.caliber` in **millimetres** and `speedUms` in **knots**.
- The campaign compiler (`packages/campaign/src/compiler.ts`) passed these
  through verbatim into `CompiledDesignVersion.normalizedArmorUm` /
  `mainGunsCaliber` / `normalizedSpeedUms`.
- The tactical classifier (`packages/combat/src/tactical/shipType.ts`) reads
  those fields as **micrometres** and **µm·s⁻¹**, per DESIGN-22 §2
  (`docs/rules/ship-classification.md`: one knot equals `514_444` µm/s, one inch
  equals `25_400` µm). On the µm scale every authored value (e.g. a 610 µm
  "belt") falls far below the 152,400 µm (6 in) family minimum.

The content was not the outlier — every fixture in the repo authors the same
mm/knots scale — so the fix belongs at the compiler boundary: normalize authored
values to the canonical units the compiled design and combat layer consume.

## Decision

1. **Authoring stays mm/knots.** `designs.yaml` and all design fixtures keep
   their human-friendly authored style (millimetres, knots). This is the
   `DesignTemplateSchema` input surface.

2. **The compiled design carries canonical engine units** (`CompiledDesignVersion`,
   `packages/campaign/src/state.ts`):
   - `normalizedDisplacementKg` — kilograms (unchanged; already canonical).
   - `normalizedSpeedUms` — knots × `514_444` (µm·s⁻¹).
   - `normalizedArmorUm` — millimetres × `1000` (µm).
   - `mainGunsCaliber` — millimetres × `1000` (µm).

3. **A single shared conversion module** `packages/campaign/src/designUnits.ts`
   exports `MM_TO_UM = 1000`, `KNOTS_TO_UMS = 514_444`, and the converters
   `knotsToUms`, `mmToUm`, `umsToKnots`, `umToMm`, re-exported from
   `@bluewave/campaign`. Consumers convert back for presentation only
   (ENGINEERING-CONTRACT: rendering derives display values; it never alters
   authoritative state).

4. **Consumers updated to the canonical units:**
   - `packages/campaign/src/compiler.ts` normalizes at compile time.
   - `packages/campaign-engine/src/construction.ts` converts µm·s⁻¹ → knots for
     the Construction screen's design catalog (correcting a pre-existing
     `*1_000_000/514_444` mis-scaling that displayed 8 kt as 16).
   - `packages/phase-engine/src/month.ts` converts the abstracted `Ship` stats
     back to knots/mm from the canonical design fields when a construction
     completes.

5. **Versioning:** the conversions are deterministic functions of authored
   values, captured in the compiled `compiledHash` via the raw validated fields.
   A change to the normalization policy is a versioned ruleset change
   (SHIP_TYPE_CLASSIFIER/design-unit version bump), not a silent behavior shift.

## Non-goals (recorded, not dropped)

- **`des_jpn_fuso` (3.72M kg) and `des_usa_amphitrite` (4.0M kg)** fall below
  the DESIGN-22 §2 "B"-family minimum displacement of 5,000,000 kg even after
  unit normalization. These small 1880 ironclads have no home in the 14-type
  canonical registry below the B floor; classification of these two ships is a
  separate, deferred canonical decision (registry/threshold change), not part of
  this ADR. `promoteTacticalUnit` reports the resulting `INVALID_SHIP_TYPE` for
  them (documented in the production-promotion test) rather than fabricating a
  type.

## Consequences

- Tactical promotion now works for the 1880-era commissioned linked ships whose
  designs meet DESIGN-22 thresholds (deterministic; verified in
  `apps/desktop/test/production-promotion.test.ts`).
- `CompiledDesignVersion` values are now consistent with the combat fixtures and
  DESIGN-22 §2 units; golden hashes are unaffected (the cross-process golden
  fixture authors no designs — `designFiles: []`).
- Display consumers convert for presentation; the Construction screen now shows
  true knots (e.g. Inflexible 8 kt, not 16).
- Design fixtures/tests that asserted pass-through mm/knots values were updated
  to canonical µm/µm·s⁻¹ assertions.

## Related requirements

`docs/rules/ship-classification.md` (DESIGN-22 §2); content audit
`docs/research/content-5-1880-pack-audit-2026-08-17.md` §4.3; ENGINEERING-CONTRACT
(determinism, rendering-derived display values).

## Related ADRs

ADR-0007 (determinism/goldens); ADR-0013 (ship-type classifier).
