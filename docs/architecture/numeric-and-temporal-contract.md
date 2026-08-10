# DESIGN-07: Numeric And Temporal Contract

> **Canonical status:** Normative migration of `SOURCE-DESIGN-v1.0.md` v1.0.
> **Requirement language:** Existing source wording is preserved. Where the source uses mandatory language, it is normative. Ambiguities are tracked in `docs/OPEN-ISSUES.md`; implementations MUST NOT invent unresolved behavior.
> **Stable document ID:** `DESIGN-07`

Authoritative Arithmetic:

- Uses integer or fixed-point arithmetic.
- Floating-point arithmetic is prohibited for authoritative outcomes.
- Rendering may use floating point but cannot alter simulation state.

Units:

- Strategic time: integer campaign months.
- Tactical time: integer battle minutes with optional fixed internal substeps.
- Ship mass: integer ruleset mass units.
- Distance: fixed-point nautical miles.
- Tactical position: fixed-point world coordinates.
- Speed: fixed-point knots.
- Armor: fixed-point inches or canonical integer armor units.
- Currency: integer budget units.
- Probability: integer basis points or equivalent fixed scale.
- Angles: normalized fixed-point angular units.
- Research: integer progress units.
- Project work: integer work units.

Rounding:

- Every formula declares its rounding mode.
- Financial debits round against the payer unless explicitly stated.
- Construction completion never occurs before accumulated work reaches total work.
- Classification and treaty checks use unrounded canonical values.
- UI values may be rounded for display but must expose detailed breakdowns.
