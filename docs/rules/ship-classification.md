# DESIGN-22: Ship Classification

> **Canonical status:** Normative migration of `SOURCE-DESIGN-v1.0.md` v1.0.
> **Requirement language:** Existing source wording is preserved. Where the source uses mandatory language, it is normative. Ambiguities are tracked in `docs/OPEN-ISSUES.md`; implementations MUST NOT invent unresolved behavior.
> **Stable document ID:** `DESIGN-22`

Classification Policy:

- The designer declares an intended ship type.
- A deterministic validator checks type-specific requirements.
- A natural classifier independently identifies the best matching type.
- Illegal mismatch is rejected or explicitly warned according to ruleset.
- Classification precedence is explicit and versioned.
- Boundary values declare inclusive or exclusive behavior.

Supported Types:

- DD
- CL
- B
- CA
- BC
- BB
- KE
- AMC
- CV
- CVL
- AV
- SS
- TR
- MTB
- Additional ruleset-defined types

Core Classification Baselines:

- DD:
  - Initially below 2,000 tons.
  - Speed above 19 knots.
  - Requires torpedoes.
  - Cannot carry qualifying armor.
  - Maximum displacement rises by technology to approximately 3,800 tons.
- CL:
  - Initially above 2,000 and below 8,000 tons.
  - Speed above 16 knots.
  - Main guns normally no larger than 6 inches.
  - Protected-cruiser and missile-era exceptions require explicit technology.
- B:
  - At least 5,000 tons.
  - Belt at least 6 inches.
  - Main guns over 6 inches.
  - Speed below 20 knots.
  - No more than two main turrets.
- CA:
  - Above 4,000 tons.
  - Speed above 19 knots.
  - Belt above 2 and no more than 12 inches.
  - Main guns from 6 through 11 inches under canonical boundary rules.
- BC:
  - Main guns over 10 inches and qualifying high speed;
  - or three main turrets and qualifying speed.
  - Speed threshold rises by era.
  - Borderline ships use explicit armor and speed precedence rules.
- BB:
  - At least three main turrets.
  - Above 8,000 tons.
  - Belt over 6 inches.
  - Main guns over 10 inches.
- KE:
  - Below 2,500 tons.
  - Belt no more than 2 inches.
  - Maximum gun caliber 6 inches.
  - No torpedoes.
- AMC:
  - Above 1,700 tons.
  - No armor.
  - Guns no larger than 6 inches.
  - Number and fast-AMC limits apply.
- CV:
  - Aircraft capacity above 34.
  - Displacement limited by carrier technology.
- CVL:
  - Aircraft capacity from 4 through 34.
  - Normally no more than 16,000 tons unless a valid conversion.
- AV:
  - Defined by aircraft-support subtype and era.

Reclassification:

- Rebuilds invoke classification again.
- Era changes alone may trigger administrative reclassification where the
  ruleset explicitly requires it.
- Classification cache must always match the current compiled design version.
