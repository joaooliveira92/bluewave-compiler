# DESIGN-17: Diplomacy

> **Canonical status:** Normative migration of `SOURCE-DESIGN-v1.0.md` v1.0.
> **Requirement language:** Existing source wording is preserved. Where the source uses mandatory language, it is normative. Ambiguities are tracked in `docs/OPEN-ISSUES.md`; implementations MUST NOT invent unresolved behavior.
> **Stable document ID:** `DESIGN-17`

Diplomatic Relation:

- Directed attitude from A to B.
- Shared bilateral tension.
- Alliance state.
- War state.
- Guarantees.
- Access rights.
- Technology-trade eligibility.
- Claims and incidents.
- Cooldowns.
- Treaty relationships.

Tension:

- Exists between every pair of active powers.
- Uses the canonical ruleset scale.
- Tension 7 or higher blocks normal canal use controlled by the other nation.
- Higher tension increases war risk.
- Tension changes are recorded in a ledger with causes.

Alliances:

- Reduce mutual tension.
- Increase expected support in war.
- Improve technology-sale availability and pricing.
- Permit allied operational support where access exists.
- May increase tension with rivals.
- May be revoked in peace if relation conditions fail.
- Are not revoked while both allies remain in the same active war.
- An ally may seek separate peace through war-participant rules.

Diplomatic Events:

- Hawkish responses may increase:
  - institutional confidence;
  - naval budget;
  - tension.
- Dovish responses may reduce tension but can reduce confidence or budget.
- Effects are explicit per event and never inferred from descriptive text.

War Entry:

- Determined by:
  - tension;
  - incidents;
  - alliances;
  - government;
  - strategic objectives;
  - events;
  - surprise opportunities.
- War is never triggered from tension alone unless the ruleset explicitly defines
  a threshold event.
