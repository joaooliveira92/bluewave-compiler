# DESIGN-25: Deployment And Logistics

> **Canonical status:** Normative migration of `SOURCE-DESIGN-v1.0.md` v1.0.
> **Requirement language:** Existing source wording is preserved. Where the source uses mandatory language, it is normative. Ambiguities are tracked in `docs/OPEN-ISSUES.md`; implementations MUST NOT invent unresolved behavior.
> **Stable document ID:** `DESIGN-25`

Deployment:

- Each ship has one strategic area.
- Divisions normally move together.
- Illegal mixed-location divisions must be split or movement rejected.

Support Capacity:

- Area support derives from controlled or accessible bases.
- Ships consume support load.
- Overload penalties are assigned by deterministic supply priority.
- Temporary overload is permitted until the end-of-month compliance phase.

Foreign-Station Requirement:

- Calculated per area from possession obligations.
- Global naval powers must maintain at least the required global percentage.
- Only eligible active and foreign-station ships contribute.
- Colonial-service ships contribute 1.5 times qualifying tonnage.
- Cramped and short-range ships contribute less.
- Requirements may be suspended during wartime blockade.
- Newly acquired possessions receive a ruleset-defined grace period.

Range:

- short
- normal
- long
- extreme

Wartime Movement:

- Short-range ships cannot make normal strategic movement outside allowed
  adjacent home-area exceptions.
- Blockaded nations cannot normally move ships out of relevant home/build areas
  except through authorized raider breakout or battle outcomes.
- Fuel shortage may cancel movement or remove battle eligibility.
- Coal ships are not affected by oil shortage.

Movement Resolution:

- Produces:
  - traversed route edge;
  - final location;
  - battle-presence state;
  - fuel result;
  - breakdown result;
  - failure reason.
