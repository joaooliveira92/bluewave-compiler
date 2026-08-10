# DESIGN-49: Events

> **Canonical status:** Normative migration of `SOURCE-DESIGN-v1.0.md` v1.0.
> **Requirement language:** Existing source wording is preserved. Where the source uses mandatory language, it is normative. Ambiguities are tracked in `docs/OPEN-ISSUES.md`; implementations MUST NOT invent unresolved behavior.
> **Stable document ID:** `DESIGN-49`

Event Definition:

- Stable identifier.
- Version.
- Scope.
- Eligibility.
- Trigger phase.
- Weight or schedule.
- Mutual-exclusion group.
- Cooldown.
- Visibility.
- Choices.
- AI-choice policy.
- Effects.
- Follow-ups.
- Expiration.
- Historical-mode restrictions.
- RNG stream.

Typed Event Effects:

- adjust_tension
- adjust_confidence
- adjust_political_capital
- adjust_unrest
- adjust_budget_rate
- adjust_resources
- grant_technology_insight
- schedule_event
- change_government
- transfer_control
- transfer_ownership
- start_war
- join_war
- add_trait
- remove_trait
- add_mandate
- create_project
- modify_objective

Event Rules:

- Arbitrary database scripts are prohibited for normal events.
- Custom procedural events require:
  - explicit implementation identifier;
  - version;
  - deterministic contract;
  - tests.
- Event text never defines mechanics independently of typed effects.
