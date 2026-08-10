# DESIGN-12: Nations And Governments

> **Canonical status:** Normative migration of `SOURCE-DESIGN-v1.0.md` v1.0.
> **Requirement language:** Existing source wording is preserved. Where the source uses mandatory language, it is normative. Ambiguities are tracked in `docs/OPEN-ISSUES.md`; implementations MUST NOT invent unresolved behavior.
> **Stable document ID:** `DESIGN-12`

Nation State:

- Identity and scenario polity.
- Government.
- Traits.
- Strategic objectives.
- Base resources.
- Naval appropriation rate.
- Treasury.
- Industrial capabilities.
- Possessions.
- Oil and supply access.
- Technologies.
- Fleet.
- Officers and manpower.
- Diplomacy.
- Wars.
- Political state.
- Intelligence state.

Government Types:

- Liberal democracy.
- Limited democracy.
- Autocratic.
- Fascist.
- Communist.
- Eastern.

Government Effects:

- Political tolerance.
- Treaty-compliance rules.
- Revolution susceptibility.
- Alliance compatibility.
- Budget behavior.
- Political mandates.
- Colonial policy.
- Officer policy.
- Wartime mobilization.

Trait Categories:

- industrial_capability
- strategic_obligation
- education_and_personnel
- research_affinity
- political_behavior
- AI_personality
- tactical_doctrine
- ship_quality
- conditional_wartime_policy

Canonical Trait Mechanics:

- Efficient shipbuilding:
  - Construction work completes 10% faster unless the ruleset defines an
    equivalent fixed work-rate implementation.
- Undeveloped shipbuilding:
  - Construction completes 10% slower.
  - Increased probability of latent construction defects.
- Global naval power:
  - Foreign-station obligation includes at least 10% of eligible tonnage.
  - Cramped accommodation is prohibited for applicable new construction.
  - Government may react to rival budget parity.
- Cautious:
  - Alters AI operational risk tolerance.
  - Increases political consequences of major defeats for the player nation.
- Poor education:
  - Reduces baseline crew and pilot quality.
  - Reduces research efficiency.
- Surprise attack:
  - Base first-war-entry surprise eligibility is 80%, subject to opportunity,
    date, previous use, intelligence, and ruleset modifiers.
- Inconsistent naval policy:
  - Increases frequency and severity of political procurement mandates.
- Attention to detail:
  - Reduces latent-defect probability and severity.
- Technology leader:
  - Improves research position and AI commitment to technical competitiveness.
  - Does not grant technologies without prerequisites.
- Hidden faults:
  - Increases latent-defect probability.
- Kamikaze:
  - Conditional policy only.
  - Requires compatible government, technology, war state, and losing-war state.
  - Improves designated offensive-air behavior while worsening defensive-air
    priorities according to ruleset modifiers.

Trait Activation:

- Every trait declares:
  - scope;
  - activation conditions;
  - duration;
  - stacking behavior;
  - applicable scenarios;
  - whether it belongs to nation, regime, or temporary state.
