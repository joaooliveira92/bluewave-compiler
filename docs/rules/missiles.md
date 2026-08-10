# DESIGN-47: Missiles

> **Canonical status:** Normative migration of `SOURCE-DESIGN-v1.0.md` v1.0.
> **Requirement language:** Existing source wording is preserved. Where the source uses mandatory language, it is normative. Ambiguities are tracked in `docs/OPEN-ISSUES.md`; implementations MUST NOT invent unresolved behavior.
> **Stable document ID:** `DESIGN-47`

Missile Categories:

- ASM
- SSM
- SAM

Sizes:

- light
- medium
- heavy

Missile Definition:

- Range.
- Speed.
- Damage.
- Seeker.
- Warhead.
- Launch platform.
- Target-quality requirement.
- Defense susceptibility.
- Reload rule.

Target Quality:

- area_report
- coarse_track
- fire_control_track
- terminally_updated_track
- visual_confirmation

Firing:

- Anti-ship missiles remain held until:
  - fire_at_will;
  - ripple;
  - half_salvo;
  - full_salvo;
  - explicit coordinated salvo.
- SAM fire is automated.

Platforms:

- Surface ships.
- Aircraft.
- Missile submarines.
- Coastal batteries.

Data-Link Fire:

- Requires technology.
- Allows attacks on contacts held by another unit.
- Uncertain reports reduce accuracy and may increase misidentification risk.

Storage:

- minimum
- adequate
- plentiful
- Low storage increases shortage risk during the first eighteen months of war.
- Stockpile has peacetime cost.
- Mount presence and missile inventory are separate.

Damage:

- Anti-ship missiles act as large explosive or semi-armor-piercing weapons.
- Cause:
  - structure damage;
  - fire;
  - sensor damage;
  - superstructure damage.
- Special missile torpedoes and diving missiles use their dedicated damage rules.
