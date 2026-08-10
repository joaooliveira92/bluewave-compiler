# DESIGN-27: Officers And Personnel

> **Canonical status:** Normative migration of `SOURCE-DESIGN-v1.0.md` v1.0.
> **Requirement language:** Existing source wording is preserved. Where the source uses mandatory language, it is normative. Ambiguities are tracked in `docs/OPEN-ISSUES.md`; implementations MUST NOT invent unresolved behavior.
> **Stable document ID:** `DESIGN-27`

Officer:

- Stable identity.
- Age cohort.
- Service-entry date.
- Rank history.
- Command history.
- True ability.
- Revealed ability estimate.
- Traits.
- Battle experience.
- Status.
- Promotion eligibility.

Ranks:

- Commander.
- Captain.
- Rear Admiral.
- Admiral.

Ability:

- brilliant
- above_average
- average
- below_average
- incompetent

Ability Knowledge:

- True ability is authoritative but initially hidden.
- Player sees an estimate and confidence.
- Service time and battle experience improve revelation.
- Estimates may remain uncertain.

Officer Traits:

- speed_enthusiast
- rof_enthusiast
- gunnery_expert
- torpedo_expert
- disciplinarian
- music_lover
- sportsman
- lucky
- aggressive
- timid
- well_connected
- wily
- poor_admin
- poor_shiphandler
- loose_cannon
- good_administrator
- no_connections

Command Eligibility:

- Commander:
  - CL or DD division.
- Captain:
  - CA, B, BB, BC, CV, CVL, or DD division.
- Rear Admiral:
  - CL or heavier division.
- Destroyers do not require individual ship-command records.

Promotion:

- Normally evaluated after approximately five years in rank.
- Can be automatic or manual.
- Early manual promotion costs political capital or confidence according to rule.
- Promotion may alter traits through explicit seeded outcomes.
- Empty command slots may be filled by deterministic administrative automation.

Removal:

- Costs political capital or institutional confidence.
- Well-connected officers impose greater political cost.

Naval Academy:

- Requires technology and establishment project.
- Produces more and somewhat better officers.
- Has recurring cost.

Personnel Pools:

- Naval manpower.
- Trained manpower.
- Specialists.
- Reservists.
- Pilot pool.
- New construction cannot become fully operational without adequate personnel.
