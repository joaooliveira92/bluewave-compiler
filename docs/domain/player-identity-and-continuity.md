# DESIGN-02: Player Identity And Campaign Continuity

> **Canonical status:** Normative migration of `SOURCE-DESIGN-v1.0.md` v1.0.
> **Requirement language:** Existing source wording is preserved. Where the source uses mandatory language, it is normative. Ambiguities are tracked in `docs/OPEN-ISSUES.md`; implementations MUST NOT invent unresolved behavior.
> **Stable document ID:** `DESIGN-02`

Player Role:

- The player represents the continuing senior leadership of the national navy.
- The role persists across retirements, promotions, regime changes, and officer
  generations.
- Individual officers remain separate simulated characters.
- "Prestige" represents institutional confidence in the player's naval
  administration, not the personal reputation of an immortal officer.

Campaign Continuity:

- Government changes do not automatically end the campaign.
- Revolution, defeat, regime change, constitutional change, or national
  succession may alter:
  - government type;
  - political mandates;
  - national traits;
  - diplomatic relations;
  - possessions;
  - budget;
  - strategic objectives;
  - officer eligibility;
  - institutional confidence.
- Campaign termination occurs only through an explicit terminal condition.

Campaign Terminal Conditions:

- Institutional confidence collapses and the naval administration is dismissed.
- The player nation ceases to have a supported continuation state.
- A scenario-specific terminal defeat condition is reached.
- The campaign reaches December 1970 and completes final evaluation.
- The player voluntarily retires the campaign.
- A canonical scenario endpoint explicitly terminates the campaign.

Non-Terminal Major Outcomes:

- Losing a war.
- Losing possessions.
- Revolution with a supported successor regime.
- Temporary fiscal insolvency.
- Fleet destruction.
- Government change.
- Treaty-imposed naval restrictions.
