# DESIGN-21: Ship Design

> **Canonical status:** Normative migration of `SOURCE-DESIGN-v1.0.md` v1.0.
> **Requirement language:** Existing source wording is preserved. Where the source uses mandatory language, it is normative. Ambiguities are tracked in `docs/OPEN-ISSUES.md`; implementations MUST NOT invent unresolved behavior.
> **Stable document ID:** `DESIGN-21`

Design Layers:

- DesignDraft:
  - Mutable player or AI work.
- DesignStudy:
  - Time-and-cost project.
- CompiledDesignVersion:
  - Immutable validated mechanical design.
- DesignFamily:
  - Related design lineage.
- NamedClass:
  - Naming and historical grouping.
- IndividualShip:
  - Commissioned physical asset.
- RefitConfiguration:
  - Ship-specific active modification state.

Design Attributes:

- Displacement.
- Speed.
- Range.
- Fuel.
- Machinery.
- Armor.
- Armament.
- Torpedoes.
- Missiles.
- Fire control.
- Radar.
- Aviation facilities.
- Topside load.
- Accommodation.
- Special features.
- Layout and firing positions.

Design Compilation:

1. Normalize units.
2. Validate technology.
3. Compute hull capacity.
4. Compute machinery and speed.
5. Compute fuel and range.
6. Compute armor weight and protection.
7. Compute weapons and ammunition.
8. Compute aviation capacity.
9. Compute electronics and topside load.
10. Compute crew and support requirements.
11. Compute displacement and margins.
12. Compute stability and flotation.
13. Validate intended classification.
14. Apply treaty rules.
15. Apply dock and construction restrictions.
16. Compute cost.
17. Compute construction work.
18. Produce immutable compiled design.

Derived Design:

- A design based on an existing family receives study discounts while all
  ruleset similarity thresholds remain satisfied.
- Similarity is lost when changes exceed limits including:
  - displacement increase greater than max(10%, 1,000 tons);
  - major main-gun change beyond ruleset allowance;
  - major secondary-gun change;
  - speed change over one knot;
  - vertical armor change over one inch;
  - horizontal armor change over half an inch.

Overweight Designs:

- Slight overweight may be accepted with explicit stability and flotation
  penalties.
- Designs beyond the legal tolerance are rejected.

Aesthetic Data:

- Superstructure drawings, visual decoration, and cosmetic arrangement are
  presentation-only unless mapped to a mechanical component.
