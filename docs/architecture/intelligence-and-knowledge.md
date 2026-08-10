# DESIGN-29: Intelligence And Knowledge

> **Canonical status:** Normative migration of `SOURCE-DESIGN-v1.0.md` v1.0.
> **Requirement language:** Existing source wording is preserved. Where the source uses mandatory language, it is normative. Ambiguities are tracked in `docs/OPEN-ISSUES.md`; implementations MUST NOT invent unresolved behavior.
> **Stable document ID:** `DESIGN-29`

Intelligence Program:

- One allocation per observed nation.
- Spending requires time to build capability.
- Interim capability is explicitly displayed.

Knowledge Assertion:

- Subject.
- Attribute.
- Estimated value or range.
- Confidence.
- Source.
- Observed date.
- Received date.
- Decay or expiration.
- Possible deception.

Enemy Construction Knowledge:

- Initially may reveal type and estimated displacement.
- Completed ships may reveal:
  - type;
  - displacement estimate;
  - weapon count and caliber estimate;
  - speed estimate.
- Official figures may be false.
- Additional attributes require intelligence or observation.

Strategic Reports:

- May contain:
  - position error;
  - strength error;
  - identification error;
  - delivery delay.
- Reports never overwrite true state.

Intelligence Effects:

- Research insight.
- Technology acquisition.
- Enemy-ship information.
- War-plan warning.
- Better battle avoidance.
- Improved wartime ASW.
- Detection may create diplomatic incidents and tension.

AI Fog of War:

- AI strategic planning uses its own knowledge assertions.
- AI does not receive player truth unless an explicit difficulty modifier grants
  defined information assistance.
