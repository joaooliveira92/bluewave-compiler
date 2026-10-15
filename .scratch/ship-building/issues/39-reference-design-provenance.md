# 39: Machine-readable provenance on reference designs

**Type:** implementation
**Status:** resolved
**Blocked by:** none
**Frontier:** yes

Source: the January-1880 reference-design review. Provenance currently lives in YAML comments and the research notes
(`docs/research/ship-building-1880-ships-by-nation.md`, `ship-building-1880-pre-era-armament.md`), which a contributor must
reconstruct by hand.

## Acceptance criteria

- Each historical reference design carries machine-readable provenance for: completion/commissioning date; displacement
  basis; armour scheme; armament configuration; machinery output; speed; the source (with page where available); and a
  VERIFIED / DERIVED / ESTIMATE status per value.
- The shape is validated (a test fails if a historical design is missing provenance or uses an unknown status), and is
  exposed on the `ReferenceDesign` type.
- The Drawing Board may surface it (e.g. a "sources" tooltip), but the data is the requirement; display is optional.
- The existing designs (`havock_like`, `majestic_like`, `torpedo_cruiser_1880`) are covered too, or explicitly marked
  non-historical.

## Comments

- 2026-10-10 created from the January-1880 reference-design review.
- 2026-10-15 resolved. `ReferenceDesignSchema` gains `historical` (marker) and a per-value `provenance`
  (`{value, status ∈ {VERIFIED,DERIVED,ESTIMATE}, sources[≥1], note?}`) covering the six facts
  (completionDate, displacementBasis, armourScheme, armamentConfiguration, machineryOutput, speed). The 18
  historical reconstructions (13 `HISTORICAL_RECONSTRUCTION` starters + the five pre-1880 in-service ships in
  the `historical.yaml` files) carry full provenance, every value traced to
  `docs/research/ship-building-1880-ships-by-nation.md` (navypedia slug / Brassey page); navypedia-only facts
  are DERIVED, the three two-source displacement facts are VERIFIED. `havock_like`, `majestic_like`,
  `torpedo_cruiser_1880` are explicitly `historical: false`; the doctrine templates are non-historical. The
  loadout read path (`referenceDesignsFromLoadouts`) joins the authored metadata back by id so the main-process
  `readReferenceDesigns()` is not a dead field.
  Tests: `packages/ship-design/test/referenceProvenance.test.ts` (28), `packages/content-schema/test/reference-design-provenance.test.ts`,
  `apps/desktop/src/main/referenceDesigns.test.ts`. Validation (branch `sprint/ship-building-30`): uncached build
  0/24; `pnpm check` green end-to-end (format, lint 0 errors, typecheck, build, content:verify hash `8884200f…`,
  test:run 2049, test:heavy 12, golden 11/11, determinism, equivalence, balance, e2e 30); `pnpm preflight` green.
  Reviewer pass: APPROVE; folded in F1 (loadout read path carries the new fields) and F2 (content-compiler
  confidence walk skips the new shape instead of mislabelling it). Committed with `Golden-Repin: not-needed`
  (the changes are reference-run-inert).
