# DESIGN-43: Aircraft

> **Canonical status:** Normative migration of `SOURCE-DESIGN-v1.0.md` v1.0.
> **Requirement language:** Existing source wording is preserved. Where the source uses mandatory language, it is normative. Ambiguities are tracked in `docs/OPEN-ISSUES.md`; implementations MUST NOT invent unresolved behavior.
> **Stable document ID:** `DESIGN-43`

Aircraft Definitions:

- fighter
- torpedo_bomber
- dive_bomber
- medium_bomber
- patrol_aircraft
- floatplane_scout
- airship
- light_jet_fighter
- heavy_jet_fighter
- jet_attack_aircraft
- helicopter
- special_squadron

Aircraft Model:

- Speed.
- Firepower.
- Maneuverability.
- Toughness.
- Load.
- Range.
- Roles.
- Basing requirements.
- Technology.

Aircraft State:

- National inventory pools.
- Squadron assignments.
- Operational aircraft.
- Damaged aircraft.
- Pilot pool.
- Squadron experience.
- Fatigue.
- Basing.

Aircraft Development:

- Player requests one proposal at a time.
- Selects role and two emphasized traits.
- Development normally takes three to six months.
- Private ventures may create purchasable proposals.
- Proposals and results are deterministic from campaign state and stream.

Squadrons:

- Auto-equip only when models and inventory are available.
- Re-equipment lowers temporary experience.
- Large expansion dilutes experience.
- Damaged aircraft count against physical basing capacity until removed or
  repaired.

Aircraft Roles:

- Fighters:
  - CAP and escort.
- Torpedo bombers:
  - Torpedo or bomb attack.
- Dive bombers:
  - Accurate ship attack with lower bomb penetration.
- Medium bombers:
  - Level, skip, torpedo, guided-weapon, or missile attack as technology allows.
- Patrol aircraft:
  - Long-range scouting and strategic ASW.
- Floatplanes:
  - Local scouting and ASW.
  - Without catapult, launch may require ship to stop.
- Airships:
  - Long-range early scouting.
  - High weather sensitivity.
- Jets:
  - Require appropriate carrier and deck technology.
- Helicopters:
  - ASW, radar extension, and modern utility roles.
