# DESIGN-34: Submarines

> **Canonical status:** Normative migration of `SOURCE-DESIGN-v1.0.md` v1.0.
> **Requirement language:** Existing source wording is preserved. Where the source uses mandatory language, it is normative. Ambiguities are tracked in `docs/OPEN-ISSUES.md`; implementations MUST NOT invent unresolved behavior.
> **Stable document ID:** `DESIGN-34`

Strategic Representation:

- Submarines are maintained as typed flotilla pools or persistent units according
  to the active ruleset.
- Tactical submarine instances are allocated from strategic assets.
- Tactical loss reduces the associated strategic pool or unit.
- One asset cannot appear in multiple simultaneous battles.

Types:

- coastal
- medium_range
- long_range
- minelaying
- missile

Submarine Policy:

- fleet_support
- prize_rules
- unrestricted

Policy Effects:

- Fleet support emphasizes warships.
- Prize rules balances warship and merchant attacks with neutral risk.
- Unrestricted maximizes merchant pressure but increases neutral incidents.

Operational Effects:

- Merchant attacks.
- Occasional warship attacks.
- Mine laying.
- Battle participation.
- Post-battle attacks on returning ships.

Modifiers:

- Technology.
- Reliability.
- Base proximity.
- Submarine type.
- Enemy trade protection.
- ASW strength.
- Heavy-ship-to-destroyer balance.
- Blockade.
- Sea state.
- Intelligence.

Coastal Submarines:

- Full efficiency near bases.
- Restricted strategic movement in war.

Long-Range Submarines:

- Better remote efficiency.
- Slightly greater ASW vulnerability where specified.

Tactical Sea State:

- Nominal optimum approximately 2–5.
- Calm conditions increase detection risk.
- Heavy conditions impair observation and attack.

Friendly-Fire Risk:

- Friendly submarines can create mistaken-identification incidents.
- Knowledge and identification rules apply.
