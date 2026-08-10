# DESIGN-32: Blockade

> **Canonical status:** Normative migration of `SOURCE-DESIGN-v1.0.md` v1.0.
> **Requirement language:** Existing source wording is preserved. Where the source uses mandatory language, it is normative. Ambiguities are tracked in `docs/OPEN-ISSUES.md`; implementations MUST NOT invent unresolved behavior.
> **Stable document ID:** `DESIGN-32`

Blockade State:

- none
- attempted
- contested
- established
- weakened
- broken

Strength:

- Derived from eligible naval strength in relevant enemy home/build areas.
- Ship types use ruleset-defined weights.
- Nation modifiers apply:
  - United Kingdom example: 1.2.
  - Russia example: 0.7.
- Damage, supply, readiness, and mission modify effective strength.

Establishment:

- Normally requires at least 110% of defending eligible strength.
- Uses PostBattleSnapshot.
- May require establishment persistence or explicit ruleset duration.

Maintenance:

- Uses hysteresis or a separate maintenance threshold to prevent monthly
  oscillation.
- Contested blockade gives partial effects.

Effects:

- Monthly war score for blockader.
- Increased unrest and shortage risk for blockaded nation.
- Movement restrictions.
- Raider breakout risk.
- Reduced merchant targets for additional submarine or raider warfare.
- Increased oil-shortage pressure.

Special Case:

- Russia may be blockaded from Northern Europe under the canonical route rule.

Multiple Home Areas:

- Blockade is evaluated per blockade theater.
- National blockade effect is derived from theater coverage and economic access.
