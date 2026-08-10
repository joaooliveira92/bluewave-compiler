# DESIGN-48: Coastal Defense

> **Canonical status:** Normative migration of `SOURCE-DESIGN-v1.0.md` v1.0.
> **Requirement language:** Existing source wording is preserved. Where the source uses mandatory language, it is normative. Ambiguities are tracked in `docs/OPEN-ISSUES.md`; implementations MUST NOT invent unresolved behavior.
> **Stable document ID:** `DESIGN-48`

Possession Defenses:

- Coastal artillery.
- Fortifications.
- Local minefields.
- Airfields.
- Radar sites.
- Coastal missile batteries.
- Patrol craft.

Placement:

- Battles use valid predefined geographic placement zones.
- Random placement selects among valid zones.
- Seed-driven placement prevents tactical optimization.
- Batteries cannot appear in geographically invalid positions.

Coastal Artillery:

- Participates in local battles.
- Increases local mine pressure.
- Gains AA capability over time.
- Uses possession-specific inventory.

Land Targets:

- airfield
- dockyard
- fuel_storage
- radar_station
- coastal_battery
- port_installation
- transport_concentration

Land-Target Damage:

- Intact.
- Suppressed.
- Damaged.
- Disabled.
- Destroyed.
- Consequences apply to campaign infrastructure after battle.
