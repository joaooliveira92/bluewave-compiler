# DESIGN-26: Divisions And Formations

> **Canonical status:** Normative migration of `SOURCE-DESIGN-v1.0.md` v1.0.
> **Requirement language:** Existing source wording is preserved. Where the source uses mandatory language, it is normative. Ambiguities are tracked in `docs/OPEN-ISSUES.md`; implementations MUST NOT invent unresolved behavior.
> **Stable document ID:** `DESIGN-26`

Permanent Division:

- Persistent campaign organization.
- One to five ships.
- Destroyer divisions may contain up to six.
- Ships normally share type.
- BB and B may mix.
- CA may join BC divisions when allowed.
- First ship is flagship.
- Has commander and experience.

Tactical Division:

- Battle-local projection.
- Derived from permanent division where possible.
- May be adjusted for availability, mission, or scenario needs.
- Must preserve provenance to campaign assets.

Roles:

- independent
- core
- support
- scout
- screen
- patrol

Formations:

- line_ahead
- line_abreast
- search_line
- screen

Experience:

- Improves over time and training.
- Falls when:
  - ships change;
  - commander changes;
  - flagship changes;
  - organization changes substantially.
- Influences:
  - signaling;
  - contact retention;
  - fire distribution;
  - formation cohesion;
  - spotting;
  - effective crew performance.

Training:

- Wartime division training improves experience faster.
- A training division is unavailable for battle that month.

Eligibility:

- Role and formation legality use ship-type and technology rules.
- Battleships cannot scout.
- Destroyers scout only if all ships meet the ruleset displacement threshold,
  nominally above 1,500 tons.
