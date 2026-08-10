# DESIGN-18: Politics, Confidence, And Unrest

> **Canonical status:** Normative migration of `SOURCE-DESIGN-v1.0.md` v1.0.
> **Requirement language:** Existing source wording is preserved. Where the source uses mandatory language, it is normative. Ambiguities are tracked in `docs/OPEN-ISSUES.md`; implementations MUST NOT invent unresolved behavior.
> **Stable document ID:** `DESIGN-18`

Political State:

- Institutional confidence.
- Political capital.
- Domestic unrest.
- War exhaustion.
- Colonial unrest by possession.
- Government confidence.
- Active mandates.
- Revolution risk.

Institutional Confidence:

- Replaces overloaded prestige as the dismissal variable.
- Represents trust in naval administration.
- A value at or below 16 creates dismissal risk.
- Dismissal checks occur only during the terminal-evaluation phase.
- Confidence changes through:
  - victories;
  - defeats;
  - fiscal management;
  - mandate compliance;
  - foreign-station compliance;
  - preparedness;
  - event choices.
- Proportional losses use explicit ruleset formulas.

Political Capital:

- Spendable resource used to influence or resist political decisions.
- Spending political capital does not directly reduce institutional confidence.
- May be used to:
  - reject a mandate;
  - negotiate requirements;
  - protect a project;
  - accelerate approval;
  - reduce political penalties.

Domestic Unrest:

- Influenced by:
  - military expenditure;
  - war duration;
  - blockade;
  - shortages;
  - defeats;
  - accommodation conditions;
  - taxation and events.
- Can cause strikes and political budget pressure.

War Exhaustion:

- Separate from general unrest.
- Initially may fall or stabilize at war outbreak.
- Increases with duration, defeat, blockade, casualties, and shortages.

Colonial Unrest:

- Possession-scoped.
- Influenced by low protection, foreign occupation, unrest events, and
  decolonization pressure.

Revolution:

- Requires explicit eligibility and threshold conditions.
- Less likely in liberal democracies.
- May:
  - change government;
  - end or alter war participation;
  - impose harsh peace terms;
  - create successor states.
- Revolution is not automatically terminal if a supported continuation exists.

Political Mandates:

- Issuing authority.
- Requirement.
- Deadline.
- Compliance test.
- Reward.
- Refusal cost.
- Negotiation options.
- Expiration.
