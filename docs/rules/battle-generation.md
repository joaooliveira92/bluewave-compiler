# DESIGN-37: Battle Generation

> **Canonical status:** Normative migration of `SOURCE-DESIGN-v1.0.md` v1.0.
> **Requirement language:** Existing source wording is preserved. Where the source uses mandatory language, it is normative. Ambiguities are tracked in `docs/OPEN-ISSUES.md`; implementations MUST NOT invent unresolved behavior.
> **Stable document ID:** `DESIGN-37`

Battle Generation Inputs:

- War.
- Mission opportunities.
- Area forces.
- Ship readiness.
- Divisions.
- Intelligence.
- Weather.
- Coastal defenses.
- Mines.
- Submarines.
- Aircraft.
- Trade context.
- Operational objectives.

Mission Types:

- fleet_battle
- cruiser_battle
- coastal_raid
- convoy_attack
- convoy_defense
- invasion
- raider_interception
- blockade_breakout
- carrier_action
- ruleset-defined variants

Generation Pipeline:

1. Determine mission opportunity.
2. Determine participating sides.
3. Create force requirements.
4. Gather eligible assets.
5. Preserve permanent divisions where possible.
6. Assign mandatory roles.
7. Add optional assets by weighted deterministic selection.
8. Add allied support.
9. Instantiate coastal, submarine, mine, and air elements.
10. Validate force reachability and legality.
11. Repair generated composition where allowed.
12. Reject irreparable engagement.
13. Canonicalize battle manifest.
14. Assign battle seed.
15. Present estimate according to intelligence.

Eligibility:

- Working-up ships excluded.
- Ships in another unresolved battle excluded.
- Fuel- or range-ineligible ships excluded.
- Mission requirements must be satisfied.
- Generated forces must remain within scenario limits.

Battle Acceptance:

- Battles may be:
  - optional;
  - politically expected;
  - operationally unavoidable.
- Declining can affect:
  - war score;
  - institutional confidence;
  - objectives.
- Consequences depend on mission and obligation, not only decline count.

Support Forces:

- Allied or non-player friendly forces may participate.
- Their information and command remain limited.
- They obey their own AI and command structure.
