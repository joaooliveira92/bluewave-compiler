# 39: Machine-readable provenance on reference designs

**Type:** implementation
**Status:** open
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
