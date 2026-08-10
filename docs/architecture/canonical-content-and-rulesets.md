# DESIGN-05: Canonical Content And Rulesets

> **Canonical status:** Normative migration of `SOURCE-DESIGN-v1.0.md` v1.0.
> **Requirement language:** Existing source wording is preserved. Where the source uses mandatory language, it is normative. Ambiguities are tracked in `docs/OPEN-ISSUES.md`; implementations MUST NOT invent unresolved behavior.
> **Stable document ID:** `DESIGN-05`

Content Pack:

- The initial release uses one canonical content pack.
- The content pack contains:
  - nations;
  - regimes;
  - scenario participation;
  - world areas;
  - adjacency;
  - possessions;
  - ports;
  - canals;
  - climate profiles;
  - technologies;
  - ship components;
  - aircraft;
  - missiles;
  - submarines;
  - coastal defenses;
  - events;
  - AI profiles;
  - historical fleets;
  - generation templates;
  - balance constants.

Ruleset:

- Contains formulas, thresholds, modifiers, weights, and rounding rules.
- Every ruleset has:
  - stable identifier;
  - semantic version;
  - content hash;
  - formula version;
  - RNG algorithm version;
  - AI-policy version.

Missing Content Policy:

- Campaign compilation fails if required canonical input is missing.
- The compiler must not silently invent:
  - nations;
  - possessions;
  - technologies;
  - starting ownership;
  - diplomatic participants;
  - required fleet designs;
  - scenario-specific continuity.
- Procedural generation is permitted only where the content contract explicitly
  marks generation as authoritative.

Provenance Labels:

- CANONICAL_CONTENT
- MANUAL_EXPLICIT
- DESIGN_DECISION
- GENERATED_CANONICAL
- SCENARIO_OVERRIDE
- RULESET_CONSTANT
- DEPRECATED

Localized text is presentation-only.
Simulation logic uses stable identifiers, never localized strings.
