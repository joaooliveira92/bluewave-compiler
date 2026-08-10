# DESIGN-04: Canonical Playable Slots

> **Canonical status:** Normative migration of `SOURCE-DESIGN-v1.0.md` v1.0.
> **Requirement language:** Existing source wording is preserved. Where the source uses mandatory language, it is normative. Ambiguities are tracked in `docs/OPEN-ISSUES.md`; implementations MUST NOT invent unresolved behavior.
> **Stable document ID:** `DESIGN-04`

Playable Slots:

1. United Kingdom
2. German Empire
3. United States
4. Empire of Japan
5. French Republic
6. Kingdom of Italy
7. Russian Empire
8. Austro-Hungarian Empire
9. Kingdom of Spain
10. Qing Dynasty

Slot Rules:

- The ten slot identities are permanent campaign-selection identities.
- Political regimes and represented state forms are scenario-specific.
- A playable slot is distinct from the scenario's historical polity instance.
- Slot identity must never be overwritten by an AI-only power.
- Each scenario must define all ten slots as:
  - active;
  - inactive;
  - or conditional on a named continuity mode.

Austro-Hungarian Slot:

- Active in 1880 and 1900 historical scenarios.
- Inactive in 1920 and 1935 historical scenarios.
- May be activated in 1920 and 1935 only by alternate_continuity_v1.
- Ottoman Empire or Turkey remains a distinct AI-only power.
- Ottoman Empire or Turkey never substitutes for this slot.

Qing Slot:

- Uses an explicit scenario polity mapping.
- Later starts may represent an approved successor continuity.
- The successor mapping must be defined by scenario content.
- It may not be inferred at runtime.

Scenario Participation:

- Every scenario contains:
  - ten canonical playable slot records;
  - twelve AI-only powers;
  - twenty-two scenario identity records.
- Inactive playable slots remain present as explicit inactive records.
- Only active or continuity-enabled slots may start a campaign.

Nation Identity Layers:

- country_identity:
  - Long-term cultural and geopolitical identity.
- political_regime:
  - Government, ideology, legal structure, and era-specific policies.
- scenario_nation_instance:
  - Concrete nation state in a specific scenario.
- playable_slot:
  - Stable player-selection identity.
- war_participant:
  - Membership in a specific war and side.
