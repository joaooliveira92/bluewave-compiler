# DESIGN-24: Fleet Management

> **Canonical status:** Normative migration of `SOURCE-DESIGN-v1.0.md` v1.0.
> **Requirement language:** Existing source wording is preserved. Where the source uses mandatory language, it is normative. Ambiguities are tracked in `docs/OPEN-ISSUES.md`; implementations MUST NOT invent unresolved behavior.
> **Stable document ID:** `DESIGN-24`

Ship State Dimensions:

Readiness State:

- active
- reserve
- mothballed
- mobilizing
- working_up
- unavailable

Operational Mission:

- fleet
- foreign_station
- trade_protection
- raider
- training
- transit
- mine_warfare
- amphibious_support

Dockyard State:

- none
- maintenance
- repair
- rebuild
- conversion

Damage State:

- operational
- degraded
- mission_killed
- dead_in_water
- abandoned
- sinking
- stabilized
- foundered
- scuttled
- sunk
- captured

Readiness Effects:

- Active:
  - Highest routine availability and training.
- Reserve:
  - Lower cost and reduced immediate effectiveness.
- Mothballed:
  - Lowest cost, poor readiness, extended reactivation.
- Working up:
  - Gains crew proficiency.
  - Cannot participate in normal battle generation.
- Repair or rebuild:
  - Availability determined by project state.

Fleet Exercise:

- Normally once per calendar year.
- Participating ships pay twice active maintenance.
- Improves crew and division experience.
- Large exercises may increase tension.
- Exercise availability and political effect are ruleset-driven.

Maintenance Warning:

- Derived from support, location, status, and infrastructure.
- Never stored as independent authority.
